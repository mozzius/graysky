import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Gallery, { type RenderItemInfo } from "react-native-awesome-gallery";
import { ContextMenuButton } from "react-native-ios-context-menu";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react-native";

import { useImageOptions } from "./image-with-context";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
  images: AppBskyEmbedImages.ViewImage[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageViewer = ({ images, initialIndex = 0, onClose }: Props) => {
  const [infoVisible, setInfoVisible] = useState(false);
  const [index, setIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  const { bottom } = useSafeAreaInsets();
  const { tag } = useLocalSearchParams<{
    tag?: string;
  }>();

  const items = useImageOptions();

  const { top } = useSafeAreaInsets();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <ContextMenuButton
        isMenuPrimaryAction={true}
        menuConfig={{
          menuTitle: "",
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
          void item.action(images[index]!.fullsize);
        }}
        className="absolute left-5 z-10 h-10 w-10"
        style={{ top: top + 10 }}
      >
        <TouchableOpacity className="flex-1 items-center justify-center rounded-full bg-black/40">
          <MoreHorizontalIcon color="white" />
        </TouchableOpacity>
      </ContextMenuButton>
      <Gallery
        data={images}
        initialIndex={initialIndex}
        keyExtractor={(_, i) => i}
        onIndexChange={(index) => setIndex(index)}
        renderItem={(props) => (
          <View style={StyleSheet.absoluteFill} className="justify-center">
            <ImageWithFallback
              {...props}
              tag={props.index === initialIndex ? tag : undefined}
            />
          </View>
        )}
        onSwipeToClose={onClose}
        onTap={() => setInfoVisible((v) => !v)}
      />
      {infoVisible && (
        <Animated.View
          entering={mounted ? FadeInDown.duration(250) : undefined}
          exiting={FadeOutDown.duration(250)}
          className="absolute bottom-0 z-10 w-full rounded-tl-2xl rounded-tr-2xl bg-black/70 px-6 pt-6"
          style={{ paddingBottom: bottom + 8 }}
        >
          <Text className="text-base text-white">{images[index]?.alt}</Text>
        </Animated.View>
      )}
    </>
  );
};

const ImageWithFallback = ({
  item,
  setImageDimensions,
  tag,
}: RenderItemInfo<AppBskyEmbedImages.ViewImage> & { tag?: string }) => {
  const queryClient = useQueryClient();

  const size = queryClient.getQueryData<{
    width: number;
    height: number;
  }>(["image", item.fullsize, "size"]);

  return (
    <>
      <AnimatedImage
        sharedTransitionTag={tag}
        // doesn't load fullsize
        // source={[item.thumb, item.fullsize]}
        // weird postitioning
        // placeholder={{
        //   width: size.data?.width,
        //   height: size.data?.height,
        //   uri: item.thumb,
        // }}
        source={item.thumb}
        alt={item.alt}
        style={
          size
            ? {
                aspectRatio: size.width / size.height,
              }
            : { width: "100%" }
        }
        onLoad={({ source: { width, height } }) => {
          setImageDimensions({
            width,
            height,
          });
          queryClient.setQueryData(["image", item.fullsize, "size"], {
            width,
            height,
          });
        }}
      />
    </>
  );
};
