import { useEffect, useState } from "react";
import {
  Image,
  ImageBackground,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Link } from "expo-router";
import {
  type AppBskyEmbedExternal,
  type AppBskyEmbedImages,
  type AppBskyEmbedRecord,
  type AppBskyEmbedRecordWithMedia,
  type AppBskyFeedPost,
} from "@atproto/api";

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

type EmbeddedImage = {
  $type: "app.bsky.embed.images#view";
} & AppBskyEmbedImages.View;

type EmbeddedExternal = {
  $type: "app.bsky.embed.external#view";
} & AppBskyEmbedExternal.View;

type EmbeddedRecord = {
  $type: "app.bsky.embed.record#view";
} & AppBskyEmbedRecord.View;

type EmbeddedRecordWithMedia = {
  $type: "app.bsky.embed.record#viewWithMedia";
} & AppBskyEmbedRecordWithMedia.View;

export type PostEmbed =
  | EmbeddedImage
  | EmbeddedExternal
  | EmbeddedRecord
  | EmbeddedRecordWithMedia;

interface Props {
  content: PostEmbed;
}

export const Embed = ({ content }: Props) => {
  try {
    switch (content.$type) {
      case "app.bsky.embed.images#view":
        return <ImageEmbed content={content} />;
      case "app.bsky.embed.external#view":
        return (
          <TouchableOpacity
            onPress={() => void Linking.openURL(content.external.uri)}
            className="my-1.5 rounded border border-neutral-300 p-2"
          >
            <Text className="text-base font-semibold" numberOfLines={2}>
              {content.external.title || content.external.uri}
            </Text>

            <Text className="text-sm text-neutral-400" numberOfLines={1}>
              {content.external.uri}
            </Text>
          </TouchableOpacity>
        );
      case "app.bsky.embed.record#view":
        // may break - TODO figure this out
        const record = content.record as AppBskyEmbedRecord.ViewRecord;
        const value = record.value as {
          $type: "app.bsky.feed.post";
        } & AppBskyFeedPost.Record;
        let postContent = null;

        switch (value.$type) {
          case "app.bsky.feed.post":
            postContent = (
              <Text className="mt-1 text-base leading-5" numberOfLines={4}>
                {value.text}
              </Text>
            );
            break;
          default:
            console.warn("Unsupported nested embed type", content);
            postContent = (
              <Text className="mt-1 text-base italic">
                Unsupported nested embed type
              </Text>
            );
        }

        return (
          <PostEmbed author={record.author} uri={record.uri}>
            {postContent}
          </PostEmbed>
        );
      case "app.bsky.embed.record#viewWithMedia":
        // may break - TODO figure this out
        const recordWithMedia =
          content.record as unknown as AppBskyEmbedRecord.ViewRecord;

        console.log(JSON.stringify(recordWithMedia, null, 2));

        return (
          <PostEmbed
            author={recordWithMedia.author}
            uri={recordWithMedia.uri}
          ></PostEmbed>
        );

      default:
        console.info("Unsupported embed type", content);
        throw new Error("Unsupported embed type");
    }
  } catch (err) {
    console.error("Error rendering embed", content, err);
    return (
      <View className="my-1.5 rounded bg-neutral-100 p-2">
        <Text className="text-center">Unsupported embed type</Text>
      </View>
    );
  }
};

const ImageEmbed = ({ content }: { content: EmbeddedImage }) => {
  const aspectRatio = useImageAspectRatio(content.images[0]!.thumb);
  switch (content.images.length) {
    case 0:
      return null;
    case 1:
      const image = content.images[0]!;
      return (
        <Image
          source={{ uri: image.thumb }}
          alt={image.alt}
          className="my-1.5 w-full rounded"
          style={{ aspectRatio }}
        />
      );
    case 2:
      return (
        <View className="my-1.5 flex flex-row justify-between overflow-hidden rounded">
          {content.images.map((image) => (
            <Image
              key={image.fullsize}
              source={{ uri: image.thumb }}
              alt={image.alt}
              className="aspect-square w-[49%]"
            />
          ))}
        </View>
      );
    case 3:
      return (
        <View className="my-1.5 flex flex-row justify-between overflow-hidden rounded">
          {content.images.map((image) => (
            <Image
              key={image.fullsize}
              source={{ uri: image.thumb }}
              alt={image.alt}
              className="aspect-square w-[32%]"
            />
          ))}
        </View>
      );
    default:
      return (
        <View className="my-1.5 flex flex-row justify-between overflow-hidden rounded">
          {content.images.slice(0, 2).map((image) => (
            <Image
              key={image.fullsize}
              source={{ uri: image.thumb }}
              alt={image.alt}
              className="aspect-square w-[24%]"
            />
          ))}
          <ImageBackground
            source={{ uri: content.images[2]!.thumb }}
            alt={content.images[2]!.alt}
            className="flex aspect-square w-[24%] flex-row"
          >
            <View className="h-full w-full items-center justify-center bg-black/60 p-1">
              <Text className="text-center text-base font-bold text-white">
                +{content.images.length - 2}
              </Text>
            </View>
          </ImageBackground>
        </View>
      );
  }
};

const PostEmbed = ({
  author,
  uri,
  children,
}: React.PropsWithChildren<{
  author: AppBskyEmbedRecord.ViewRecord["author"];
  uri: string;
}>) => {
  const profileHref = `/profile/${author.handle}`;

  const postHref = `/${profileHref}/post/${uri.split("/").pop()}`;

  return (
    <Link href={postHref} asChild>
      <TouchableOpacity className="my-1.5 flex-1 rounded border border-neutral-300 p-2">
        <View className="flex flex-row items-center overflow-hidden">
          <Image
            source={{ uri: author.avatar }}
            alt={author.displayName}
            className="mr-2 h-4 w-4 rounded-full"
          />
          <Text className="text-base" numberOfLines={1}>
            <Text className="font-semibold">{author.displayName}</Text>
            <Text className="text-neutral-500">{` @${author.handle}`}</Text>
          </Text>
        </View>
        {children}
      </TouchableOpacity>
    </Link>
  );
};
