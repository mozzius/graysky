import { useState } from "react";
import { StyleSheet } from "react-native";
import { ContextMenuView } from "react-native-ios-context-menu";
import Animated from "react-native-reanimated";
import { showToastable } from "react-native-toastable";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import { Image, type ImageStyle } from "expo-image";
import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CopyIcon, SaveIcon, Share2Icon } from "lucide-react-native";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
  image: AppBskyEmbedImages.ViewImage;
  depth: number;
  className?: string;
  style?: ImageStyle | ImageStyle[];
  useCappedAspectRatio?: boolean;
  onPressMenuPreview?: () => void;
  tag?: string;
}

export const ImageWithContextMenu = ({
  image,
  depth,
  className: _,
  useCappedAspectRatio,
  style,
  onPressMenuPreview,
  // tag,
  ...props
}: Props) => {
  const hintedHeight = image.aspectRatio?.height ?? 1;
  const hintedWidth = image.aspectRatio?.width ?? 1;
  const [aspectRatio, setAspectRatio] = useState(hintedWidth / hintedHeight);
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
      // TODO: Figure out how to grow preview to correct aspect ratio
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
      onPressMenuPreview={onPressMenuPreview}
    >
      <AnimatedImage
        // sharedTransitionTag={tag}
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
  const theme = useTheme();
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
      reactIcon: <CopyIcon size={24} color={theme.colors.text} />,
      action: async (uri: string) => {
        try {
          const download = await downloadImage(uri);
          const base64 = await FileSystem.readAsStringAsync(download.uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
          await Clipboard.setImageAsync(base64);
          showToastable({
            message: "Copied image to clipboard",
            status: "success",
          });
        } catch (err) {
          console.error(err);
          showToastable({
            message: "An error occured while trying to copy the image",
            status: "danger",
          });
        }
      },
      icon: "doc.on.doc",
    },
    {
      key: "save",
      label: "Save Image",
      reactIcon: <SaveIcon size={24} color={theme.colors.text} />,
      action: async (uri: string) => {
        if (!(await MediaLibrary.requestPermissionsAsync()).granted) {
          showToastable({
            title: "Permission required",
            message: "Please enable photo gallery access in your settings",
            status: "warning",
          });
          return;
        }
        try {
          const download = await downloadImage(uri);
          await MediaLibrary.saveToLibraryAsync(download.uri);
          showToastable({
            message: "Saved image to gallery",
            status: "success",
          });
        } catch (err) {
          console.error(err);
          showToastable({
            message: "An error occured while trying to save the image",
            status: "danger",
          });
        }
      },
      icon: "arrow.down.to.line",
    },
  ];
  if (canShare) {
    items.push({
      key: "share",
      label: "Share via...",
      reactIcon: <Share2Icon size={24} color={theme.colors.text} />,
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
          showToastable({
            message: "An error occured while trying to share the image",
            status: "danger",
          });
        }
      },
      icon: "square.and.arrow.up",
    });
  }

  return items;
};
