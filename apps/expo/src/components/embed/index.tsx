import { useState } from "react";
import {
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
  type ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import {
  CheckIcon,
  FileXIcon,
  HeartIcon,
  ShieldXIcon,
  Trash2Icon,
} from "lucide-react-native";

import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useContentFilter } from "~/lib/hooks/preferences";
import { cx } from "~/lib/utils/cx";
import { isType } from "~/lib/utils/types";
import { Avatar } from "../avatar";
import { TextButton } from "../text-button";
import { Text } from "../themed/text";
import { ExternalEmbed } from "./external";
import { ImageEmbed } from "./image";
import { VideoEmbed } from "./video";

interface Props {
  uri: string;
  content: app.bsky.feed.defs.FeedViewPost["post"]["embed"];
  truncate?: boolean;
  depth?: number;
  transparent?: boolean;
  isNotification?: boolean;
}

export const Embed = ({
  uri,
  content,
  truncate = true,
  depth = 0,
  transparent = false,
  isNotification = false,
}: Props) => {
  const theme = useTheme();

  if (!content) return null;

  try {
    // Case 1: Image
    if (isType(app.bsky.embed.images.view, content)) {
      return (
        <ImageEmbed
          uri={uri}
          content={content}
          depth={depth}
          isNotification={isNotification}
        />
      );
    }

    // Case 2: External link
    if (isType(app.bsky.embed.external.view, content)) {
      return (
        <ExternalEmbed
          content={content}
          transparent={transparent}
          depth={depth}
        />
      );
    }

    // Case 3: Record (quote or linked post)
    if (isType(app.bsky.embed.record.view, content)) {
      const record = content.record;

      // Case 3.1: Post
      if (isType(app.bsky.embed.record.viewRecord, record)) {
        let text;
        if (isType(app.bsky.feed.post, record.value)) {
          text = record.value.text;
        }
        return (
          <View className="mt-1.5 flex-1">
            <PostEmbed
              post={record}
              transparent={transparent || isNotification}
            >
              {text && (
                <Text
                  className="mt-1 text-base leading-5"
                  numberOfLines={truncate ? 4 : undefined}
                >
                  {text}
                </Text>
              )}
              {record.embeds?.map((embed, i) => (
                <Embed
                  key={record.uri + i}
                  uri={record.uri}
                  content={embed}
                  depth={depth + 1}
                />
              ))}
            </PostEmbed>
          </View>
        );
      }

      // Case 3.2: List
      if (isType(app.bsky.graph.defs.listView, record)) {
        return <ListEmbed list={record} />;
      }

      // Case 3.3: Feed
      if (isType(app.bsky.feed.defs.generatorView, record)) {
        return <FeedGeneratorEmbed generator={record} />;
      }

      // Case 3.4: Post not found
      if (isType(app.bsky.embed.record.viewNotFound, record)) {
        return <ViewNotFound depth={depth} />;
      }

      // Case 3.5: Post blocked
      if (isType(app.bsky.embed.record.viewBlocked, record)) {
        return <ViewBlocked depth={depth} />;
      }

      throw new Error("Unsupported record type");
    }

    // Case 4: Record with media
    if (isType(app.bsky.embed.recordWithMedia.view, content)) {
      return (
        <View className="mt-1.5 flex-1 gap-x-1.5">
          <Embed uri={uri} content={content.media} depth={depth} />
          <Embed
            uri={uri}
            content={{
              $type: "app.bsky.embed.record#view",
              record: content.record.record,
            }}
            depth={depth}
          />
        </View>
      );
    }

    // Case 5: Video
    if (isType(app.bsky.embed.video.view, content)) {
      return <VideoEmbed key={content.playlist} video={content} />;
    }

    throw new Error("Unsupported embed type");
  } catch (err) {
    // console.error("Error rendering embed", content);
    return (
      <View
        className={cx(
          "mt-1.5 flex-1 flex-row items-center rounded-md border",
          depth > 0 ? "p-2" : "p-3",
        )}
        style={{ borderColor: theme.colors.border }}
      >
        <FileXIcon size={16} color={theme.colors.text} />
        <Text className="ml-2">
          {err instanceof Error ? err.message : "An error occurred"}
        </Text>
      </View>
    );
  }
};

export const PostEmbed = ({
  post,
  children,
  transparent,
  className,
  style,
}: React.PropsWithChildren<{
  post: app.bsky.embed.record.ViewRecord;
  transparent?: boolean;
  className?: string;
  style?: ViewStyle;
}>) => {
  const theme = useTheme();
  const path = useAbsolutePath();
  const profileHref = path(`/profile/${post.author.did}`);
  const { contentFilter, preferences } = useContentFilter();
  const postHref = `${profileHref}/post/${post.uri.split("/").pop()}`;
  const [hidden, setHidden] = useState(true);
  const { _ } = useLingui();

  const filter = contentFilter(post.labels);

  if (filter?.visibility === "hide") return null;

  if (filter?.visibility === "warn" && hidden) {
    return (
      <View
        className={cx(
          "my-2 max-w-xl flex-row items-center justify-between rounded border px-2",
          theme.dark
            ? "border-neutral-700 bg-neutral-950"
            : "border-neutral-300 bg-neutral-50",
        )}
      >
        <Text className="my-1 max-w-[75%] font-semibold">
          {filter ? (
            filter.message
          ) : post.author.viewer?.muted ? (
            <Trans>This post is from someone you have muted</Trans>
          ) : (
            <Trans>This post is from someone you have blocked</Trans>
          )}
        </Text>
        <TextButton
          title={hidden ? _(msg`Show`) : _(msg`Hide`)}
          onPress={() => setHidden((h) => !h)}
        />
      </View>
    );
  }

  return (
    <Link href={postHref} asChild>
      <TouchableWithoutFeedback
        accessibilityHint={_(msg`Opens embedded post`)}
        className={cx(
          "mt-1.5 flex-1 rounded-lg",
          preferences.isPending && "opacity-0",
          className,
        )}
        style={style}
      >
        <View
          className="flex-1 rounded-lg border px-2 pb-2 pt-1"
          style={{
            backgroundColor: transparent
              ? "transparent"
              : theme.dark
                ? "black"
                : "white",
            borderColor: theme.colors.border,
          }}
        >
          <View className="flex flex-row items-center overflow-hidden">
            <Avatar
              size="extraSmall"
              uri={post.author.avatar}
              alt={post.author.displayName}
              className="mr-2 shrink-0"
            />
            <Text className="flex-1 text-base" numberOfLines={1}>
              <Text className="font-semibold">{post.author.displayName}</Text>
              <Text className="text-neutral-500 dark:text-neutral-400">{` @${post.author.handle}`}</Text>
            </Text>
          </View>
          {children}
        </View>
      </TouchableWithoutFeedback>
    </Link>
  );
};

const FeedGeneratorEmbed = ({
  generator,
}: {
  generator: app.bsky.feed.defs.GeneratorView;
}) => {
  const theme = useTheme();
  const path = useAbsolutePath();

  const href = path(
    `/profile/${generator.creator.did}/feed/${generator.uri.split("/").pop()}`,
  );
  // TODO: add hold menu
  // - open feed
  // - save to my feeds
  // - like feed
  return (
    <Link href={href} asChild>
      <TouchableHighlight className="mt-1.5 flex-1 rounded-lg">
        <View
          className="flex-1 flex-row items-center rounded-lg border p-2"
          style={{
            backgroundColor: theme.dark ? "black" : "white",
            borderColor: theme.colors.border,
          }}
        >
          <Image
            recyclingKey={generator.avatar}
            alt={generator.displayName}
            source={{ uri: generator.avatar }}
            className="h-14 w-14 rounded bg-blue-500"
          />
          <View className="ml-2 flex-1">
            <Text className="text-lg font-medium">{generator.displayName}</Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              <HeartIcon
                fill="currentColor"
                className={
                  generator.viewer?.like
                    ? "text-red-500"
                    : "text-neutral-500 dark:text-neutral-400"
                }
                size={12}
              />{" "}
              <Text style={{ fontVariant: ["tabular-nums"] }}>
                {generator.likeCount ?? 0}
              </Text>{" "}
              • @{generator.creator.handle}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    </Link>
  );
};

const ListEmbed = ({ list }: { list: app.bsky.graph.defs.ListView }) => {
  const theme = useTheme();
  const path = useAbsolutePath();
  const href = path(
    `/profile/${list.creator.did}/lists/${list.uri.split("/").pop()}`,
  );
  let purposeText = "List";
  switch (list.purpose) {
    case "app.bsky.graph.defs#modlist":
      purposeText = "Moderation list";
      break;
    case "app.bsky.graph.defs#curatelist":
      purposeText = "User list";
      break;
  }
  return (
    <Link href={href} asChild>
      <TouchableHighlight className="mt-1.5 flex-1 rounded-lg">
        <View
          className="flex-1 flex-row items-center rounded-lg border p-2"
          style={{
            backgroundColor: theme.dark ? "black" : "white",
            borderColor: theme.colors.border,
          }}
        >
          <Image
            recyclingKey={list.avatar}
            alt={list.name}
            source={{ uri: list.avatar }}
            className="h-14 w-14 rounded bg-blue-500"
          />
          <View className="ml-2 flex-1">
            <Text className="text-lg font-medium">
              {list.name}
              {(list.viewer?.blocked || list.viewer?.muted) && (
                <>
                  {" "}
                  <CheckIcon color={theme.colors.primary} size={12} />
                </>
              )}
            </Text>
            <Text className="text-sm text-neutral-500 dark:text-neutral-400">
              {purposeText} by @{list.creator.handle}
            </Text>
          </View>
        </View>
      </TouchableHighlight>
    </Link>
  );
};

const ViewNotFound = ({ depth }: { depth: number }) => {
  const theme = useTheme();

  return (
    <View
      className={cx(
        "mt-1.5 flex-1 flex-row items-center rounded-md border",
        depth > 0 ? "p-2" : "p-3",
      )}
      style={{
        borderColor: theme.colors.border,
      }}
    >
      <Trash2Icon size={16} color={theme.colors.text} />
      <Text className="ml-2">Deleted post</Text>
    </View>
  );
};

const ViewBlocked = ({ depth }: { depth: number }) => {
  const theme = useTheme();

  return (
    <View
      className={cx(
        "mt-1.5 flex-1 flex-row items-center rounded-md border",
        depth > 0 ? "p-2" : "p-3",
      )}
      style={{
        borderColor: theme.colors.border,
      }}
    >
      <ShieldXIcon size={16} color={theme.colors.text} />
      <Text className="ml-2">This post is blocked</Text>
    </View>
  );
};
