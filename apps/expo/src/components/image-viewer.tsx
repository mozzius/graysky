import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import Gallery from "react-native-awesome-gallery";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { type AppBskyEmbedImages } from "@atproto/api";

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

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      <Gallery
        data={images}
        initialIndex={initialIndex}
        keyExtractor={(_, i) => i}
        onIndexChange={(index) => setIndex(index)}
        renderItem={({ item, setImageDimensions }) => (
          <Image
            source={item.fullsize}
            contentFit="contain"
            alt={item.alt}
            style={StyleSheet.absoluteFillObject}
            onLoad={({ source: { width, height } }) =>
              setImageDimensions({
                width,
                height,
              })
            }
          />
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
