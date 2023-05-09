/* eslint-disable no-case-declarations */
import { useEffect, useState } from "react";
import { Image, Linking, Text, View } from "react-native";
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { Link } from "expo-router";
import {
  AppBskyEmbedExternal,
  AppBskyEmbedImages,
  AppBskyEmbedRecord,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedPost,
  type AppBskyActorDefs,
  type AppBskyFeedDefs,
} from "@atproto/api";

import { queryClient } from "../lib/query-client";
import { assert } from "../lib/utils/assert";
import { cx } from "../lib/utils/cx";

function useImageAspectRatio(imageUrl: string) {
  const [aspectRatio, setAspectRatio] = useState(1);

  useEffect(() => {
    if (!imageUrl) {
      return;
    }

    let isValid = true;
    Image.getSize(imageUrl, (width, height) => {
      if (isValid) {
        setAspectRatio(width / height);
      }
    });

    return () => {
      isValid = false;
    };
  }, [imageUrl]);

  return aspectRatio;
}

interface Props {
  uri: string;
  content: AppBskyFeedDefs.FeedViewPost["post"]["embed"];
  truncate?: boolean;
  depth?: number;
}

export const Embed = ({ uri, content, truncate = true, depth = 0 }: Props) => {
  if (!content) return null;

  try {
    // Case 1: Image
    if (AppBskyEmbedImages.isView(content)) {
      assert(AppBskyEmbedImages.validateView(content));
      return <ImageEmbed uri={uri} content={content} depth={depth} />;
    }

    // Case 2: External link
    if (AppBskyEmbedExternal.isView(content)) {
      assert(AppBskyEmbedExternal.validateView(content));
      return (
        <TouchableOpacity
          onPress={() => void Linking.openURL(content.external.uri)}
          className="mt-1.5 overflow-hidden rounded border border-neutral-300 dark:border-neutral-600"
        >
          {content.external.thumb && (
            <Image
              key={content.external.thumb}
              source={{ uri: content.external.thumb }}
              alt={content.external.title || content.external.uri}
              className="h-32 w-full object-cover"
            />
          )}
          <View
            className={cx(
              "w-full p-2",
              content.external.thumb &&
                "border-t border-neutral-300 dark:border-neutral-600",
            )}
          >
            <Text
              className="text-base font-semibold dark:text-neutral-50"
              numberOfLines={2}
            >
              {content.external.title || content.external.uri}
            </Text>
            <Text
              className="text-sm text-neutral-400 dark:text-neutral-100"
              numberOfLines={1}
            >
              {content.external.uri}
            </Text>
            {content.external.description && (
              <Text
                className="mt-1 text-sm leading-5 dark:text-neutral-50"
                numberOfLines={2}
              >
                {content.external.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>
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
      if (!AppBskyEmbedRecord.isViewRecord(record))
        throw new Error("Not found");
      assert(AppBskyEmbedRecord.validateViewRecord(record));

      if (!AppBskyFeedPost.isRecord(record.value))
        throw new Error("An error occurred");
      assert(AppBskyFeedPost.validateRecord(record.value));

      return (
        <>
          {media && <Embed uri={uri} content={media} depth={depth + 1} />}
          <PostEmbed author={record.author} uri={record.uri}>
            {record.value.text && (
              <Text
                className="mt-1 text-base leading-5 dark:text-neutral-50"
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
        </>
      );
    }

    throw new Error("Unsupported embed type");
  } catch (err) {
    console.error("Error rendering embed", content, err);
    return (
      <View className="my-1.5 rounded bg-neutral-100 p-2">
        <Text className="text-center">{(err as Error).message}</Text>
      </View>
    );
  }
};

const ImageEmbed = ({
  uri,
  content,
  depth,
}: {
  uri: string;
  content: AppBskyEmbedImages.View;
  depth: number;
}) => {
  const aspectRatio = useImageAspectRatio(content.images[0]!.thumb);
  const href = `/images/${encodeURIComponent(uri)}`;

  useEffect(() => {
    queryClient.setQueryData(["images", uri], content.images);
  }, [content.images, uri]);

  switch (content.images.length) {
    case 0:
      return null;
    case 1:
      const image = content.images[0]!;
      return (
        <Link href={href} asChild>
          <TouchableWithoutFeedback accessibilityRole="image">
            <Image
              key={image.thumb}
              source={{ uri: image.thumb }}
              alt={image.alt}
              className="mt-1.5 w-full rounded"
              style={{
                aspectRatio:
                  depth > 0
                    ? Math.max(aspectRatio, 1.5)
                    : Math.max(aspectRatio, 0.5),
              }}
            />
          </TouchableWithoutFeedback>
        </Link>
      );
    case 2:
      return (
        <View className="mt-1.5 flex flex-row justify-between overflow-hidden rounded">
          {content.images.map((image, i) => (
            <View
              className={cx("w-1/2", i % 2 === 0 ? "pr-0.5" : "pl-0.5")}
              key={image.thumb}
            >
              <Link href={`${href}?initial=${i}`} asChild>
                <TouchableWithoutFeedback accessibilityRole="image">
                  <Image
                    key={image.thumb}
                    source={{ uri: image.thumb }}
                    alt={image.alt}
                    className="aspect-square"
                  />
                </TouchableWithoutFeedback>
              </Link>
            </View>
          ))}
        </View>
      );
    case 3:
      return (
        <View className="mt-1.5 flex aspect-[3/2] flex-row justify-between overflow-hidden rounded">
          <View className="w-1/2 pr-0.5">
            <Link href={`${href}?initial=0`} asChild>
              <TouchableWithoutFeedback accessibilityRole="image">
                <Image
                  key={content.images[0]!.thumb}
                  source={{ uri: content.images[0]!.thumb }}
                  alt={content.images[0]!.alt}
                  className="h-full w-full object-cover"
                />
              </TouchableWithoutFeedback>
            </Link>
          </View>
          <View className="h-full w-1/2 flex-1 flex-col pl-0.5">
            {content.images.slice(1).map((image, i) => (
              <View
                className={cx(
                  "h-1/2 w-full",
                  i % 2 === 0 ? "pb-0.5" : "pt-0.5",
                )}
                key={image.fullsize}
              >
                <Link href={`${href}?initial=${i + 1}`} asChild>
                  <TouchableWithoutFeedback accessibilityRole="image">
                    <Image
                      key={image.thumb}
                      source={{ uri: image.thumb }}
                      alt={image.alt}
                      className="h-full w-full object-cover"
                    />
                  </TouchableWithoutFeedback>
                </Link>
              </View>
            ))}
          </View>
        </View>
      );
    case 4:
      return (
        <View className="mt-1.5 flex flex-row flex-wrap justify-between overflow-hidden rounded">
          {content.images.map((image, i) => (
            <View
              key={image.fullsize}
              className={cx(
                "w-1/2",
                i > 1 && "mt-1",
                i % 2 === 0 ? "pr-0.5" : "pl-0.5",
              )}
            >
              <Link href={`${href}?initial=${i}`} asChild>
                <TouchableWithoutFeedback accessibilityRole="image">
                  <Image
                    key={image.thumb}
                    source={{ uri: image.thumb }}
                    alt={image.alt}
                    className="aspect-square"
                  />
                </TouchableWithoutFeedback>
              </Link>
            </View>
          ))}
        </View>
      );
    default:
      throw Error("Unsupported number of images");
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
    <View className="mt-1.5 flex-1 rounded border border-neutral-300 px-2 pb-2 pt-1 dark:border-neutral-600">
      <Link href={postHref} asChild>
        <TouchableOpacity accessibilityHint="Opens embedded post">
          <View className="flex flex-row items-center overflow-hidden">
            <Image
              key={author.avatar}
              source={{ uri: author.avatar }}
              alt={author.displayName}
              className="mr-2 h-4 w-4 rounded-full"
            />
            <Text className="text-base" numberOfLines={1}>
              <Text className="font-semibold dark:text-neutral-50">
                {author.displayName}
              </Text>
              <Text className="text-neutral-500 dark:text-neutral-400">{` @${author.handle}`}</Text>
            </Text>
          </View>
          {children}
        </TouchableOpacity>
      </Link>
    </View>
  );
};
