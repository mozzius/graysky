import { useEffect, useState } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Gallery, { type RenderItemInfo } from "react-native-awesome-gallery";
import { ContextMenuButton } from "react-native-ios-context-menu";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeOutDown,
  FadeOutUp,
  Layout,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useHaptics } from "~/lib/hooks/preferences";
import { cx } from "~/lib/utils/cx";
import { useImageOptions } from "./image-with-context";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
  images: AppBskyEmbedImages.ViewImage[];
  initialIndex?: number;
  onClose: () => void;
  infoVisible: boolean;
  toggleInfo: () => void;
}

export const ImageViewer = ({
  images,
  initialIndex = 0,
  onClose,
  infoVisible,
  toggleInfo,
}: Props) => {
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [index, setIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);
  const { bottom } = useSafeAreaInsets();
  const haptics = useHaptics();
  const { tag } = useLocalSearchParams<{
    tag?: string;
  }>();

  const { top } = useSafeAreaInsets();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {infoVisible && (
        <ImageOptionsButton
          image={images[index]!}
          className="absolute left-5 z-10 h-10 w-10 flex-1"
          style={{ top: top + 10 }}
        >
          <Animated.View
            entering={FadeInUp}
            exiting={FadeOutUp}
            className="flex-1 items-center justify-center rounded-full bg-black/50"
          >
            <MoreHorizontalIcon color="white" />
          </Animated.View>
        </ImageOptionsButton>
      )}
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
        onTap={toggleInfo}
      />
      {infoVisible && images[index]?.alt && (
        <Animated.View
          entering={mounted ? FadeInDown : undefined}
          exiting={FadeOutDown}
          layout={Layout}
          className={cx(
            "absolute bottom-0 z-10 w-full rounded-tl-lg rounded-tr-lg px-6 pt-6",
            infoExpanded ? "bg-black/90" : "bg-black/50",
          )}
          style={{ paddingBottom: bottom + 8 }}
        >
          <TouchableWithoutFeedback
            accessibilityLabel="Expand alt text"
            accessibilityRole="button"
            className="flex-1"
            onPress={() => {
              haptics.selection();
              setInfoExpanded((v) => !v);
            }}
            onLongPress={(evt) => {
              evt.preventDefault();
            }}
          >
            {/* consider scrollview */}
            <Text
              className="text-base text-white"
              numberOfLines={infoExpanded ? undefined : 2}
              selectable
            >
              {images[index]?.alt}
            </Text>
          </TouchableWithoutFeedback>
        </Animated.View>
      )}
    </>
  );
};

const ImageOptionsButton = ({
  image,
  children,
  style,
}: {
  image: AppBskyEmbedImages.ViewImage;
  style: StyleProp<ViewStyle>;
  className?: string;
  children: React.ReactNode;
}) => {
  const items = useImageOptions();
  const { showActionSheetWithOptions } = useActionSheet();
  const { colorScheme } = useColorScheme();
  const haptics = useHaptics();
  const theme = useTheme();

  return Platform.OS === "ios" ? (
    <ContextMenuButton
      isMenuPrimaryAction={true}
      accessibilityLabel="Image options"
      accessibilityRole="button"
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
        void item.action(image.fullsize);
      }}
      style={style}
    >
      {children}
    </ContextMenuButton>
  ) : (
    <TouchableOpacity
      accessibilityLabel="Image options"
      accessibilityRole="button"
      onPress={() => {
        haptics.impact();
        showActionSheetWithOptions(
          {
            options: [...items.map((x) => x.label), "Cancel"],
            icons: [...items.map((x) => x.reactIcon), <></>],
            cancelButtonIndex: items.length,
            userInterfaceStyle: colorScheme,
            textStyle: { color: theme.colors.text },
            containerStyle: { backgroundColor: theme.colors.card },
          },
          (index) => {
            if (index === undefined) return;
            void items[index]?.action(image.fullsize);
          },
        );
      }}
      style={style}
    >
      {children}
    </TouchableOpacity>
  );
};

const ImageWithFallback = ({
  item,
  setImageDimensions,
  tag,
}: RenderItemInfo<AppBskyEmbedImages.ViewImage> & { tag?: string }) => {
  const queryClient = useQueryClient();

  const size =
    queryClient.getQueryData<{
      width: number;
      height: number;
    }>(["image", item.fullsize, "size"]) ?? item.aspectRatio;

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
          size ? { aspectRatio: size.width / size.height } : { width: "100%" }
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
