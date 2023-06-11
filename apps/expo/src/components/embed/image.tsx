import { useEffect, useState } from "react";
import { Alert, TouchableWithoutFeedback, View } from "react-native";
import { HoldItem } from "react-native-hold-menu";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import { Link } from "expo-router";
import * as Sharing from "expo-sharing";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyPlus, Download, Upload } from "lucide-react-native";

import { cx } from "../../lib/utils/cx";

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

  const { data: canShare } = useQuery({
    queryKey: ["is-sharing-available"],
    queryFn: () => Sharing.isAvailableAsync(),
  });

  const downloadImage = async (
    uri: string,
    directory = FileSystem.cacheDirectory,
  ) => {
    let imgType = uri.split("@").pop();
    imgType ||= "jpeg";
    const date = Date.now();
    if (!directory) throw new Error("Invalid directory");
    const fileUri = directory + `${date}.${imgType}`;
    const download = await FileSystem.downloadAsync(uri, fileUri, {});
    return {
      uri: download.uri,
      type: `image/${imgType}`,
    };
  };

  const holdItems = () => {
    const items = [
      {
        text: "Copy Image",
        onPress: async (uri: string) => {
          try {
            const download = await downloadImage(uri);
            const base64 = await FileSystem.readAsStringAsync(download.uri, {
              encoding: FileSystem.EncodingType.Base64,
            });
            await Clipboard.setImageAsync(base64);
          } catch (err) {
            console.error(err);
            Alert.alert(
              "Error",
              "An error occured while trying to copy the image",
            );
          }
        },
        icon: () => <CopyPlus size={18} color={theme.colors.text} />,
      },
      {
        text: "Save Image",
        onPress: async (uri: string) => {
          if (!(await MediaLibrary.requestPermissionsAsync()).granted) {
            Alert.alert(
              "Error",
              "You need to grant permission to save images to your library",
            );
            return;
          }
          try {
            const download = await downloadImage(uri);
            await MediaLibrary.saveToLibraryAsync(download.uri);
          } catch (err) {
            console.error(err);
            Alert.alert(
              "Error",
              "An error occured while trying to copy the image",
            );
          }
        },
        icon: () => <Download size={18} color={theme.colors.text} />,
      },
    ];
    if (canShare) {
      items.push({
        text: "Share via...",
        onPress: async (uri: string) => {
          try {
            const res = await downloadImage(uri);
            await Sharing.shareAsync(res.uri, {
              dialogTitle: "Share image",
              mimeType: res.type,
              UTI: res.type,
            });
          } catch (err) {
            console.error(err);
            Alert.alert(
              "Error",
              "An error occured while trying to share the image",
            );
          }
        },
        icon: () => <Upload size={18} color={theme.colors.text} />,
      });
    }
    return items;
  };

  switch (content.images.length) {
    case 0:
      return null;
    case 1:
      const image = content.images[0]!;
      return (
        <HoldItem
          items={holdItems()}
          actionParams={{
            "Save Image": [image.fullsize],
            "Copy Image": [image.fullsize],
            "Share via...": [image.fullsize],
          }}
        >
          <Link href={href} asChild>
            <TouchableWithoutFeedback accessibilityRole="image">
              <Image
                recyclingKey={uri}
                source={{ uri: image.thumb }}
                alt={image.alt}
                className="mt-1.5 w-full shrink-0 rounded-lg"
                style={{
                  aspectRatio: Math.max(depth === 0 ? 0.66 : 2, aspectRatio),
                }}
                onLoad={({ source: { width, height } }) =>
                  setAspectRatio(width / height)
                }
              />
            </TouchableWithoutFeedback>
          </Link>
        </HoldItem>
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
        <View className="mt-1.5 flex aspect-[3/2] flex-row justify-between overflow-hidden rounded-lg">
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
