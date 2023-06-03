import { useEffect, useState } from "react";
import { TouchableWithoutFeedback, View } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useQueryClient } from "@tanstack/react-query";

import { cx } from "../../lib/utils/cx";

interface Props {
  uri: string;
  content: AppBskyEmbedImages.View;
  depth: number;
  className?: string;
}

export const ImageEmbed = ({ uri, content, depth, className }: Props) => {
  const href = `/images/${encodeURIComponent(uri)}`;
  const [aspectRatio, setAspectRatio] = useState(1);
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
            <Image
              recyclingKey={uri}
              source={{ uri: image.thumb }}
              alt={image.alt}
              className={cx("mt-1.5 w-full rounded-lg", className)}
              style={{ aspectRatio }}
              onLoad={({ source: { width, height } }) =>
                setAspectRatio(Math.max(depth === 0 ? 0.66 : 2, width / height))
              }
            />
          </TouchableWithoutFeedback>
        </Link>
      );
    case 2:
      return (
        <View
          className={cx(
            "mt-1.5 flex flex-row justify-between overflow-hidden rounded-lg",
            className,
          )}
        >
          {content.images.map((image, i) => (
            <View
              className={cx("w-1/2", i % 2 === 0 ? "pr-0.5" : "pl-0.5")}
              key={image.fullsize}
            >
              <Link href={`${href}?initial=${i}`} asChild>
                <TouchableWithoutFeedback accessibilityRole="image">
                  <Image
                    recyclingKey={uri}
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
        <View
          className={cx(
            "mt-1.5 flex aspect-[3/2] flex-row justify-between overflow-hidden rounded-lg",
            className,
          )}
        >
          <View className="w-1/2 pr-0.5">
            <Link href={`${href}?initial=0`} asChild>
              <TouchableWithoutFeedback accessibilityRole="image">
                <Image
                  recyclingKey={uri}
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
                      recyclingKey={uri}
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
        <View
          className={cx(
            "mt-1.5 flex flex-row flex-wrap justify-between overflow-hidden rounded-lg",
            className,
          )}
        >
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
                    recyclingKey={uri}
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
