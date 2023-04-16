import { useEffect, useState } from "react";
import { Image, Linking, Text, TouchableOpacity, View } from "react-native";

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
  images: {
    alt: string;
    fullsize: string;
    thumb: string;
  }[];
};

type EmbeddedExternal = {
  $type: "app.bsky.embed.external#view";
  external: {
    description: string;
    thumb: string;
    title: string;
    uri: string;
  };
};

export type PostEmbed = EmbeddedImage | EmbeddedExternal;

interface Props {
  content: PostEmbed;
}

export const Embed = ({ content }: Props) => {
  switch (content.$type) {
    case "app.bsky.embed.images#view":
      return <ImageEmbed content={content} />;
    case "app.bsky.embed.external#view":
      return (
        <TouchableOpacity
          onPress={() => void Linking.openURL(content.external.uri)}
          className="my-1.5 rounded border p-2"
        >
          <Text className="text-base" numberOfLines={2}>
            {content.external.title}
          </Text>
          <Text className="text-sm text-neutral-400" numberOfLines={1}>
            {content.external.uri}
          </Text>
        </TouchableOpacity>
      );
    default:
      console.info("Unsupported embed type", content);
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
    default:
      const image = content.images[0]!;
      return (
        <Image
          source={{ uri: image.thumb }}
          alt={image.alt}
          className="my-1.5 w-full rounded"
          style={{ aspectRatio }}
        />
      );
  }
};
