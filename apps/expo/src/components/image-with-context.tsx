import { useState } from "react";
import { Alert, StyleSheet } from "react-native";
import { ContextMenuView } from "react-native-ios-context-menu";
import Animated from "react-native-reanimated";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import { Image, type ImageStyle } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
  image: AppBskyEmbedImages.ViewImage;
  depth: number;
  className?: string;
  style?: ImageStyle | ImageStyle[];
  useCappedAspectRatio?: boolean;
  tag?: string;
}

export const ImageWithContext = ({
  image,
  depth,
  className: _,
  useCappedAspectRatio,
  style,
  tag,
  ...props
}: Props) => {
  const [aspectRatio, setAspectRatio] = useState(1);
  const items = useImageOptions();

  const cappedAspectRatio = Math.max(depth === 0 ? 0.66 : 2, aspectRatio);

  const imageStyle = useCappedAspectRatio
    ? (StyleSheet.compose(
        { aspectRatio: cappedAspectRatio },
        style,
      ) as ImageStyle)
    : style;

  const queryClient = useQueryClient();

  return (
    <ContextMenuView
      previewConfig={{
        // TODO: Get this working
        // previewSize: "STRETCH",
        previewSize: "INHERIT",
        previewType: "CUSTOM",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      renderPreview={() => (
        <Image
          source={{ uri: image.thumb }}
          alt={image.alt}
          recyclingKey={image.thumb}
          style={{ aspectRatio }}
          className="w-full"
        />
      )}
      menuConfig={{
        menuTitle: image.alt,
        menuItems: items.map((item) => ({
          actionKey: item.key,
          actionTitle: item.label,
          icon: {
            iconType: "SYSTEM",
            iconValue: item.icon,
          },
        })),
      }}
      onPressMenuItem={(evt) => {
        const item = items.find(
          (item) => item.key === evt.nativeEvent.actionKey,
        );
        if (!item) return;
        void item.action(image.fullsize);
      }}
    >
      <AnimatedImage
        sharedTransitionTag={tag}
        source={{ uri: image.thumb }}
        alt={image.alt}
        recyclingKey={image.thumb}
        style={imageStyle}
        onLoad={({ source: { width, height } }) => {
          setAspectRatio(width / height);
          // I don't like this in the slightest
          queryClient.setQueryData(["image", image.fullsize, "size"], {
            width,
            height,
          });
        }}
        {...props}
      />
    </ContextMenuView>
  );
};

export const useImageOptions = () => {
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

  const items = [
    {
      key: "copy",
      label: "Copy Image",
      action: async (uri: string) => {
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
      icon: "doc.on.doc",
    },
    {
      key: "save",
      label: "Save Image",
      action: async (uri: string) => {
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
            "An error occured while trying to save the image",
          );
        }
      },
      icon: "arrow.down.to.line",
    },
  ];
  if (canShare) {
    items.push({
      key: "share",
      label: "Share via...",
      action: async (uri: string) => {
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
      icon: "square.and.arrow.up",
    });
  }

  return items;
};
