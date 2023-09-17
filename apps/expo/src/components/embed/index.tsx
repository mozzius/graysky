import {
  TouchableHighlight,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  type AppBskyActorDefs,
} from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { HeartIcon } from "lucide-react-native";

import { Text } from "../text";
import { ExternalEmbed } from "./external";
import { ImageEmbed } from "./image";

interface Props {
  uri: string;
  content: AppBskyFeedDefs.FeedViewPost["post"]["embed"];
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
    if (AppBskyEmbedImages.isView(content)) {
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
    if (AppBskyEmbedExternal.isView(content)) {
      return (
        <ExternalEmbed
          content={content}
          transparent={transparent}
          depth={depth}
        />
      );
    }

    // Case 3: Record (quote or linked post)
    let record: AppBskyEmbedRecord.View["record"] | null = null;
    let media: AppBskyEmbedRecordWithMedia.View["media"] | null = null;

    if (AppBskyEmbedRecord.isView(content)) {
      record = content.record;
    }

    if (AppBskyEmbedRecordWithMedia.isView(content)) {
      record = content.record.record;
      media = content.media;
    }

    if (record !== null) {
      if (!AppBskyEmbedRecord.isViewRecord(record)) {
        if (AppBskyFeedDefs.isGeneratorView(record)) {
          // Case 3.5: Is feed generator
          const href = `/profile/${record.creator.did}/feed/${record.uri
            .split("/")
            .pop()}`;
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
                    recyclingKey={record.avatar}
                    alt={record.displayName}
                    source={{ uri: record.avatar }}
                    className="h-14 w-14 rounded bg-blue-500"
                  />
                  <View className="ml-2 flex-1">
                    <Text className="text-lg font-medium">
                      {record.displayName}
                    </Text>
                    <Text className="text-sm text-neutral-500 dark:text-neutral-400">
                      <HeartIcon
                        fill="currentColor"
                        className={
                          record.viewer?.like
                            ? "text-red-500"
                            : "text-neutral-500 dark:text-neutral-400"
                        }
                        size={12}
                      />{" "}
                      <Text className="tabular-nums">
                        {record.likeCount ?? 0}
                      </Text>{" "}
                      • @{record.creator.handle}
                    </Text>
                  </View>
                </View>
              </TouchableHighlight>
            </Link>
          );
        } else if (AppBskyEmbedRecord.isViewNotFound(record)) {
          throw new Error("Post not found");
        } else if (AppBskyEmbedRecord.isViewBlocked(record)) {
          throw new Error("This post is from a blocked user");
        } else {
          throw new Error("An error occurred");
        }
      }

      if (!AppBskyFeedPost.isRecord(record.value))
        throw new Error("An error occurred");

      return (
        <View className="mt-1.5 flex-1">
          {media && (
            <View className="mb-1.5 flex-1">
              <Embed uri={uri} content={media} depth={depth} />
            </View>
          )}
          <PostEmbed
            author={record.author}
            uri={record.uri}
            transparent={transparent || isNotification}
          >
            {record.value.text && (
              <Text
                className="mt-1 text-base leading-5"
                numberOfLines={truncate ? 4 : undefined}
              >
                {record.value.text}
              </Text>
            )}
            {/* in what case will there be more than one? in what order do we show them? */}
            {record.embeds && record.embeds.length > 0 && (
              <Embed
                uri={record.uri}
                content={record.embeds[0]}
                depth={depth + 1}
              />
            )}
          </PostEmbed>
        </View>
      );
    }

    throw new Error("Unsupported embed type");
  } catch (err) {
    console.error("Error rendering embed", content, err);
    return (
      <View className="my-1.5 rounded-sm border border-neutral-300 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-950">
        <Text className="text-center font-semibold">
          {(err as Error).message}
        </Text>
      </View>
    );
  }
};

export const PostEmbed = ({
  author,
  uri,
  children,
  transparent,
}: React.PropsWithChildren<{
  author: AppBskyActorDefs.ProfileViewBasic;
  uri: string;
  transparent?: boolean;
}>) => {
  const theme = useTheme();
  const profileHref = `/profile/${author.handle}`;

  const postHref = `${profileHref}/post/${uri.split("/").pop()}`;

  return (
    <Link href={postHref} asChild>
      <TouchableWithoutFeedback
        accessibilityHint="Opens embedded post"
        className="mt-1.5 flex-1 rounded-lg"
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
            <Image
              recyclingKey={author.avatar}
              source={{ uri: author.avatar }}
              alt={author.displayName}
              className="mr-2 h-4 w-4 rounded-full bg-neutral-200 dark:bg-neutral-800"
            />
            <Text className="flex-1 text-base" numberOfLines={1}>
              <Text className="font-semibold">{author.displayName}</Text>
              <Text className="text-neutral-500 dark:text-neutral-400">{` @${author.handle}`}</Text>
            </Text>
          </View>
          {children}
        </View>
      </TouchableWithoutFeedback>
    </Link>
  );
};
