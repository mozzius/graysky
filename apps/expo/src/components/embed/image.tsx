import { useEffect, useState } from "react";
import {
  Alert,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

import { cx } from "../../lib/utils/cx";
import { ImageWithContext } from "../image-with-context";

interface Props {
  uri: string;
  content: AppBskyEmbedImages.View;
  depth: number;
}

export const ImageEmbed = ({ uri, content, depth }: Props) => {
  const href = `/images/${encodeURIComponent(uri)}`;
  const [aspectRatio, setAspectRatio] = useState(1);
  const theme = useTheme();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.setQueryData(["images", uri], content.images);
  }, [content.images, uri, queryClient]);

  useEffect(() => () => setAspectRatio(1), [uri]);

  switch (content.images.length) {
    case 0:
      return null;
    case 1:
      const image = content.images[0]!;
      return (
        <Link href={href} asChild>
          <TouchableWithoutFeedback accessibilityRole="image">
            <View
              className="mt-1.5 overflow-hidden rounded-lg"
              style={{
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
              }}
            >
              <ImageWithContext
                image={image}
                depth={depth}
                className="w-full shrink-0"
                useCappedAspectRatio
              />
            </View>
          </TouchableWithoutFeedback>
        </Link>
      );
    case 2:
      return (
        <View className="mt-1.5 flex flex-row justify-between overflow-hidden rounded-lg">
          {content.images.map((image, i) => (
            <View
              className={cx("w-1/2", i % 2 === 0 ? "pr-0.5" : "pl-0.5")}
              key={image.fullsize}
            >
              <Link href={`${href}?initial=${i}`} asChild>
                <TouchableWithoutFeedback accessibilityRole="image">
                  <ImageWithContext
                    image={image}
                    depth={depth}
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
        <View className="mt-1.5 flex aspect-[3/2] flex-row justify-between overflow-hidden rounded-lg">
          <View className="w-1/2 pr-0.5">
            <Link href={`${href}?initial=0`} asChild>
              <TouchableWithoutFeedback accessibilityRole="image">
                <ImageWithContext
                  image={content.images[0]!}
                  depth={depth}
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
                    <ImageWithContext
                      image={image}
                      depth={depth}
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
        <View className="mt-1.5 flex flex-row flex-wrap justify-between overflow-hidden rounded-lg">
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
                  <ImageWithContext
                    image={image}
                    depth={depth}
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
