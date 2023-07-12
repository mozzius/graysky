import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Gallery, { type RenderItemInfo } from "react-native-awesome-gallery";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
        renderItem={(props) => (
          <View style={StyleSheet.absoluteFill} className="justify-center">
            <ImageWithFallback {...props} tag={tag} />
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

  const size = useQuery<{
    width: number;
    height: number;
  }>({
    queryKey: ["image", item.fullsize, "size"],
  });

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
          size.data
            ? {
                aspectRatio: size.data.width / size.data.height,
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
