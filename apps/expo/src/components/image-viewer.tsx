import { Dimensions, Image, StyleSheet } from "react-native";
import {
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { snapPoint } from "react-native-redash";
import { type AppBskyEmbedImages } from "@atproto/api";

const { width, height } = Dimensions.get("screen");

interface Props {
  images: AppBskyEmbedImages.ViewImage[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageViewer = ({ images, initialIndex = 0, onClose }: Props) => {
  const snapPointsX = images.map((_, i) => i * -width);
  const snapPointsY = [height * 1.5, 0, -height * 1.5];

  const x = useSharedValue(initialIndex * -width);
  const y = useSharedValue(0);

  const delayedClose = () => setTimeout(() => onClose(), 200);

  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    {
      startX: number;
      lastY: number;
    }
  >({
    onStart: (_, ctx) => {
      ctx.startX = x.value;
      ctx.lastY = 0;
    },
    onActive: (event, ctx) => {
      x.value = ctx.startX + event.translationX;
      y.value = event.translationY;

      ctx.lastY = y.value;
    },
    onEnd: (event) => {
      const closestInitialIndex = Math.round(x.value / -width);
      const snapPointsEitherSide = snapPointsX.filter((_, i) => {
        return (
          i === closestInitialIndex ||
          i === closestInitialIndex + 1 ||
          i === closestInitialIndex - 1
        );
      });
      x.value = withSpring(
        snapPoint(x.value, event.velocityX, snapPointsEitherSide),
        {
          damping: 20,
          mass: 0.5,
        },
      );
      const yDest = snapPoint(y.value, event.velocityY, snapPointsY);
      y.value = withSpring(yDest, {
        damping: 20,
        mass: 2,
      });
      if (yDest !== 0) {
        runOnJS(delayedClose)();
      }
    },
  });

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: x.value }],
    };
  });

  const animatedImageStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: y.value },
        { scale: 1 - Math.abs(y.value) / height },
      ],
      opacity: 1 - Math.abs(y.value) / height,
    };
  });

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        {images.map((image, i) => {
          return (
            <Animated.View
              key={`${image.fullsize}-${i}`}
              style={[styles.image, animatedImageStyle]}
            >
              <Image
                source={{ uri: image.fullsize }}
                alt={image.alt}
                className="flex-1"
                resizeMode="contain"
              />
            </Animated.View>
          );
        })}
      </Animated.View>
    </PanGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
  },
  image: {
    width,
    height,
  },
});
