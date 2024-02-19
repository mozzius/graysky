import { useEffect, useId } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { type ImageStyle } from "expo-image";
import { Link, useRouter } from "expo-router";
import { type AppBskyEmbedImages } from "@atproto/api";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

import { cx } from "~/lib/utils/cx";
import { ImageWithContextMenu } from "../image-with-context-menu";

interface Props {
  uri: string;
  content: AppBskyEmbedImages.View;
  depth: number;
  isNotification: boolean;
}

export const ImageEmbed = ({ uri, content, depth, isNotification }: Props) => {
  const href = `/images/${encodeURIComponent(uri)}`;
  const theme = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(["images", uri], content.images);
  }, [content.images, uri, queryClient]);

  // just square images in the notifications screen
  if (isNotification) {
    return (
      <View className="mt-1.5 flex-1 flex-row">
        {content.images.map((image, index) => (
          <Image
            key={image.fullsize}
            href={`${href}?initial=${index}`}
            image={image}
            depth={depth}
            className="mr-2 aspect-square w-20 rounded-lg"
            style={{
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
            }}
          />
        ))}
      </View>
    );
  }

  switch (content.images.length) {
    case 0:
      return null;
    case 1: {
      const image = content.images[0]!;
      return (
        <View
          className="relative mt-1.5 overflow-hidden rounded-lg"
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          }}
        >
          <Alt alt={image.alt} />
          <Image
            href={href}
            image={image}
            depth={depth}
            className="w-full shrink-0"
            useCappedAspectRatio
          />
        </View>
      );
    }
    case 2:
      return (
        <View className="mt-1.5 flex-row justify-between overflow-hidden rounded-lg">
          {content.images.map((image, i) => (
            <View
              className={cx(
                "relative w-1/2",
                i % 2 === 0 ? "pr-0.5" : "pl-0.5",
              )}
              key={image.fullsize}
            >
              <Alt alt={image.alt} />
              <Image
                href={href}
                index={i}
                image={image}
                depth={depth}
                className="aspect-square"
              />
            </View>
          ))}
        </View>
      );
    case 3:
      return (
        <View className="mt-1.5 aspect-[3/2] flex-row justify-between overflow-hidden rounded-lg">
          <View className="pr-0.50 w-1/2">
            <Alt alt={content.images[0]!.alt} />
            <Image
              href={href}
              image={content.images[0]!}
              depth={depth}
              className="h-full w-full object-cover"
            />
          </View>
          <View className="h-full w-1/2 flex-1 flex-col pl-0.5">
            {content.images.slice(1).map((image, i) => (
              <View
                className={cx(
                  "relative h-1/2 w-full",
                  i % 2 === 0 ? "pb-0.5" : "pt-0.5",
                )}
                key={image.fullsize}
              >
                <Alt alt={image.alt} />
                <Image
                  href={href}
                  index={i + 1}
                  image={image}
                  depth={depth}
                  className="h-full w-full object-cover"
                />
              </View>
            ))}
          </View>
        </View>
      );
    case 4:
      return (
        <View className="mt-1.5 flex-row flex-wrap justify-between overflow-hidden rounded-lg">
          {content.images.map((image, i) => (
            <View
              className={cx(
                "relative w-1/2",
                i > 1 && "mt-1",
                i % 2 === 0 ? "pr-0.5" : "pl-0.5",
              )}
              key={image.fullsize}
            >
              <Alt alt={image.alt} />
              <Image
                href={href}
                index={i}
                image={image}
                depth={depth}
                className="aspect-square"
              />
            </View>
          ))}
        </View>
      );
    default:
      throw Error("Unsupported number of images");
  }
};

interface ImageProps {
  image: AppBskyEmbedImages.ViewImage;
  href: string;
  depth: number;
  index?: number;
  className?: string;
  style?: ImageStyle | ImageStyle[];
  useCappedAspectRatio?: boolean;
}

const Image = ({
  image,
  href,
  depth,
  index = 0,
  className,
  useCappedAspectRatio,
  style,
}: ImageProps) => {
  const tag = useId();
  const router = useRouter();
  const link = `${href}?initial=${index}&tag=${tag}`;
  return (
    <Link href={link} asChild>
      <TouchableWithoutFeedback accessibilityRole="image">
        <ImageWithContextMenu
          tag={tag}
          image={image}
          depth={depth}
          className={className}
          style={style}
          useCappedAspectRatio={useCappedAspectRatio}
          onPressMenuPreview={() => router.push(link)}
        />
      </TouchableWithoutFeedback>
    </Link>
  );
};

interface AltProps {
  alt?: string;
}

export const Alt = ({ alt }: AltProps) => {
  const { _ } = useLingui();
  if (!alt) return null;
  return (
    <View className="absolute bottom-1.5 left-1.5 z-10 rounded">
      <TouchableWithoutFeedback
        accessibilityLabel={_(msg`View ALT text`)}
        className="rounded"
        onPress={() => {
          Alert.alert(_(msg`ALT text`), alt);
        }}
      >
        <View className="rounded bg-black/60 px-1 py-px">
          <Text className="text-xs font-medium text-white">ALT</Text>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};
