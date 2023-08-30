/* eslint-disable jsx-a11y/alt-text */
import { useEffect, useId } from "react";
import { StyleSheet, TouchableWithoutFeedback, View } from "react-native";
import { ImageStyle } from "expo-image";
import { Link } from "expo-router";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

import { cx } from "~/lib/utils/cx";
import { ImageWithContext } from "../image-with-context";

interface Props {
  uri: string;
  content: AppBskyEmbedImages.View;
  depth: number;
}

export const ImageEmbed = ({ uri, content, depth }: Props) => {
  const href = `/images/${encodeURIComponent(uri)}`;
  const theme = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(["images", uri], content.images);
  }, [content.images, uri, queryClient]);

  switch (content.images.length) {
    case 0:
      return null;
    case 1:
      const image = content.images[0]!;
      return (
        <View
          className="mt-1.5 overflow-hidden rounded-lg"
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          }}
        >
          <Image
            href={href}
            image={image}
            depth={depth}
            className="w-full shrink-0"
            useCappedAspectRatio
          />
        </View>
      );
    case 2:
      return (
        <View className="mt-1.5 flex-row justify-between overflow-hidden rounded-lg">
          {content.images.map((image, i) => (
            <View
              className={cx("w-1/2", i % 2 === 0 ? "pr-0.5" : "pl-0.5")}
              key={image.fullsize}
            >
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
                  "h-1/2 w-full",
                  i % 2 === 0 ? "pb-0.5" : "pt-0.5",
                )}
                key={image.fullsize}
              >
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
                "w-1/2",
                i > 1 && "mt-1",
                i % 2 === 0 ? "pr-0.5" : "pl-0.5",
              )}
              key={image.fullsize}
            >
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
  return (
    <Link href={`${href}?initial=${index}&tag=${tag}`} asChild>
      <TouchableWithoutFeedback accessibilityRole="image">
        <ImageWithContext
          tag={tag}
          image={image}
          depth={depth}
          className={className}
          style={style}
          useCappedAspectRatio={useCappedAspectRatio}
        />
      </TouchableWithoutFeedback>
    </Link>
  );
};
