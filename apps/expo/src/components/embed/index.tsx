import {
  Linking,
  Text,
  TouchableHighlight,
  TouchableOpacity,
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

import { assert } from "../../lib/utils/assert";
import { cx } from "../../lib/utils/cx";
import { ImageEmbed } from "./image";

interface Props {
  uri: string;
  content: AppBskyFeedDefs.FeedViewPost["post"]["embed"];
  truncate?: boolean;
  depth?: number;
  className?: string;
}

export const Embed = ({
  uri,
  content,
  truncate = true,
  depth = 0,
  className,
}: Props) => {
  if (!content) return null;

  try {
    // Case 1: Image
    if (AppBskyEmbedImages.isView(content)) {
      assert(AppBskyEmbedImages.validateView(content));
      return (
        <ImageEmbed
          className={className}
          uri={uri}
          content={content}
          depth={depth}
        />
      );
    }

    // Case 2: External link
    if (AppBskyEmbedExternal.isView(content)) {
      assert(AppBskyEmbedExternal.validateView(content));
      return (
        <TouchableHighlight
          onPress={() => void Linking.openURL(content.external.uri)}
          className={cx("mt-1.5 rounded-lg", className)}
        >
          <View className="rounded-lg border border-neutral-300 dark:border-neutral-800">
            {content.external.thumb && (
              <Image
                recyclingKey={content.external.thumb}
                source={{ uri: content.external.thumb }}
                alt={content.external.title || content.external.uri}
                className="aspect-[2/1] w-full object-cover"
              />
            )}
            <View
              className={cx(
                "w-full p-2",
                content.external.thumb &&
                  "border-t border-neutral-300 dark:border-neutral-800",
              )}
            >
              <Text
                className="text-sm leading-5 text-neutral-400 dark:text-neutral-100"
                numberOfLines={1}
              >
                {new URL(content.external.uri).hostname}
              </Text>
              <Text
                className="mt-0.5 text-base font-semibold leading-5 dark:text-white"
                numberOfLines={2}
              >
                {content.external.title || content.external.uri}
              </Text>
              {content.external.description &&
                depth === 0 &&
                !content.external.thumb && (
                  <Text
                    className="mt-0.5 text-sm leading-5 dark:text-white"
                    numberOfLines={2}
                  >
                    {content.external.description}
                  </Text>
                )}
            </View>
          </View>
        </TouchableHighlight>
      );
    }

    // Case 3: Record (quote or linked post)
    let record: AppBskyEmbedRecord.View["record"] | null = null;
    let media: AppBskyEmbedRecordWithMedia.View["media"] | null = null;

    if (AppBskyEmbedRecord.isView(content)) {
      assert(AppBskyEmbedRecord.validateView(content));
      record = content.record;
    }

    if (AppBskyEmbedRecordWithMedia.isView(content)) {
      assert(AppBskyEmbedRecordWithMedia.validateView(content));
      record = content.record.record;
      media = content.media;
    }

    if (record !== null) {
      // record can either be ViewRecord or ViewNotFound
      if (!AppBskyEmbedRecord.isViewRecord(record)) {
        if (AppBskyFeedDefs.isGeneratorView(record)) {
          const href = `/profile/${record.creator.did}/generator/${record.uri
            .split("/")
            .pop()}`;
          return (
            <Link href={href} asChild>
              <TouchableOpacity>
                <View
                  className={cx(
                    "mt-1.5 flex-row items-center rounded-lg border border-neutral-200 p-2 dark:border-neutral-700",
                    className,
                  )}
                >
                  <Image
                    alt={record.displayName}
                    source={{ uri: record.avatar }}
                    className="h-14 w-14 rounded bg-blue-500"
                  />
                  <View className="ml-2">
                    <Text className="text-lg font-medium">
                      {record.displayName}
                    </Text>
                    <Text className="text-base leading-5 text-neutral-400">
                      By @{record.creator.handle}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
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
      assert(AppBskyEmbedRecord.validateViewRecord(record));

      if (!AppBskyFeedPost.isRecord(record.value))
        throw new Error("An error occurred");
      assert(AppBskyFeedPost.validateRecord(record.value));

      return (
        <View className={className}>
          {media && <Embed uri={uri} content={media} depth={depth + 1} />}
          <PostEmbed author={record.author} uri={record.uri}>
            {record.value.text && (
              <Text
                className="mt-1 text-base leading-5 dark:text-white"
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
      <View
        className={cx(
          "my-1.5 rounded-sm border border-neutral-300 bg-neutral-50 p-2 dark:border-neutral-700 dark:bg-neutral-950",
          className,
        )}
      >
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
}: React.PropsWithChildren<{
  author: AppBskyActorDefs.ProfileViewBasic;
  uri: string;
}>) => {
  const profileHref = `/profile/${author.handle}`;

  const postHref = `/${profileHref}/post/${uri.split("/").pop()}`;

  return (
    <Link href={postHref} asChild>
      <TouchableHighlight
        accessibilityHint="Opens embedded post"
        className="mt-1.5 flex-1 rounded-lg"
      >
        <View className="flex-1 rounded-lg border border-neutral-300 bg-white px-2 pb-2 pt-1 dark:border-neutral-800 dark:bg-black">
          <View className="flex flex-row items-center overflow-hidden">
            <Image
              recyclingKey={author.avatar}
              source={{ uri: author.avatar }}
              alt={author.displayName}
              className="mr-2 h-4 w-4 rounded-full bg-neutral-200 dark:bg-neutral-800"
            />
            <Text className="text-base" numberOfLines={1}>
              <Text className="font-semibold dark:text-white">
                {author.displayName}
              </Text>
              <Text className="text-neutral-500 dark:text-neutral-400">{` @${author.handle}`}</Text>
            </Text>
          </View>
          {children}
        </View>
      </TouchableHighlight>
    </Link>
  );
};
