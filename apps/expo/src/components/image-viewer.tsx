import { useEffect, useRef } from "react";
import { Dimensions, Image, ScrollView, View } from "react-native";
import { AppBskyEmbedImages } from "@atproto/api";

const { width, height } = Dimensions.get("screen");

interface Props {
  images: AppBskyEmbedImages.ViewImage[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageViewer = ({ images, initialIndex = 0, onClose }: Props) => {
  return (
    <ScrollView
      horizontal
      snapToInterval={width}
      decelerationRate="fast"
      contentOffset={{ x: initialIndex * width, y: 0 }}
    >
      {images.map((image, i) => {
        return (
          <View key={i} className="w-screen flex-1">
            <Image
              source={{ uri: image.fullsize }}
              className="flex-1"
              resizeMode="contain"
            />
          </View>
        );
      })}
    </ScrollView>
  );
};
