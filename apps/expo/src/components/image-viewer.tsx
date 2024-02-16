import { useCallback, useEffect, useRef, useState } from "react";
import {
  Platform,
  Text,
  TouchableOpacity,
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
  useReducedMotion,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
import { useLocalSearchParams } from "expo-router";
import { type AppBskyEmbedImages } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { DarkTheme, ThemeProvider, useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react-native";

import { useBottomSheetStyles } from "~/lib/bottom-sheet";
import { useHaptics } from "~/lib/hooks/preferences";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { BackButtonOverride } from "./back-button-override";
import { useImageOptions } from "./image-with-context-menu";
import { Translation } from "./translation";

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
  const [index, setIndex] = useState(initialIndex);
  const [mounted, setMounted] = useState(false);

  const { _ } = useLingui();
  const haptics = useHaptics();
  const { tag } = useLocalSearchParams<{
    tag?: string;
  }>();

  const bottomSheetRef = useRef<BottomSheetModal>(null);

  const [unmountTag, setUnmountTag] = useState(tag);

  useEffect(() => {
    setUnmountTag(undefined);
  }, []);

  const { top, bottom } = useSafeAreaInsets();
  const frame = useSafeAreaFrame();

  useEffect(() => {
    setMounted(true);
  }, []);

  const {
    backgroundStyle,
    handleStyle,
    handleIndicatorStyle,
    contentContainerStyle,
  } = useBottomSheetStyles(DarkTheme);

  const onPressBackButton = useCallback(
    () => bottomSheetRef.current?.dismiss(),
    [],
  );

  const reducedMotion = useReducedMotion();

  return (
    <>
      {infoVisible && (
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOutUp}
          className="absolute right-5 z-10 h-10 w-10 flex-1"
        >
          <ImageOptionsButton
            image={images[index]!}
            className="flex-1"
            style={{ top: top + 10 }}
          >
            <View className="flex-1 items-center justify-center rounded-full bg-black/50">
              <MoreHorizontalIcon color="white" />
            </View>
          </ImageOptionsButton>
        </Animated.View>
      )}
      <Gallery
        data={images}
        initialIndex={initialIndex}
        keyExtractor={(_, i) => i}
        onIndexChange={(index) => setIndex(index)}
        renderItem={(props) => (
          <SafeAreaView className="flex-1 items-center justify-center">
            <ImageWithFallback
              {...props}
              tag={props.index === initialIndex ? unmountTag : undefined}
            />
          </SafeAreaView>
        )}
        onSwipeToClose={onClose}
        onTap={toggleInfo}
      />
      {/* ALT TEXT STUFF */}
      {infoVisible && images[index]?.alt && (
        <Animated.View
          entering={mounted ? FadeInDown : undefined}
          exiting={FadeOutDown}
          className="absolute bottom-0 z-10 w-full"
        >
          <PlatformSpecificBackdrop>
            <TouchableOpacity
              accessibilityLabel={_(msg`Read full ALT text`)}
              accessibilityRole="button"
              className="flex-1 flex-row items-center px-4 pt-4"
              style={{ paddingBottom: bottom + 8 }}
              onPress={() => {
                haptics.selection();
                bottomSheetRef.current?.present();
              }}
              onLongPress={(evt) => {
                evt.preventDefault();
              }}
            >
              <View className="mr-2 rounded-sm bg-black/50 px-1">
                <Text className="text-xs font-medium text-white">
                  <Trans>ALT</Trans>
                </Text>
              </View>
              <Text className="flex-1 text-base text-white" numberOfLines={1}>
                {images[index]?.alt}
              </Text>
            </TouchableOpacity>
          </PlatformSpecificBackdrop>
        </Animated.View>
      )}
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        maxDynamicContentSize={frame.height - top}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
        handleIndicatorStyle={handleIndicatorStyle}
        handleStyle={handleStyle}
        backgroundStyle={backgroundStyle}
        animateOnMount={!reducedMotion}
      >
        <BottomSheetScrollView style={contentContainerStyle} className="flex-1">
          <BackButtonOverride dismiss={onPressBackButton} />
          <View className="px-4" style={{ marginBottom: bottom + 16 }}>
            <Text className="mt-2 text-center text-xl font-medium text-white">
              <Trans>ALT Text</Trans>
            </Text>
            <Text className="mb-2 mt-4 text-base text-white" selectable>
              {images[index]?.alt}
            </Text>
            <ThemeProvider value={DarkTheme}>
              <Translation
                uri={images[index]!.fullsize}
                text={images[index]?.alt ?? ""}
              />
            </ThemeProvider>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    </>
  );
};

const PlatformSpecificBackdrop: (props: {
  children: React.ReactNode;
}) => React.ReactNode = Platform.select({
  ios: ({ children }) => (
    <BlurView intensity={100} className="flex-1" tint="dark">
      {children}
    </BlurView>
  ),
  default: ({ children }) => (
    <View className="flex-1 bg-black/70">{children}</View>
  ),
});

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
  const { _ } = useLingui();

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
      accessibilityLabel={_(msg`Image options`)}
      accessibilityRole="button"
      onPress={() => {
        haptics.impact();
        showActionSheetWithOptions(
          {
            options: [...items.map((x) => x.label), _(msg`Cancel`)],
            icons: [...items.map((x) => x.reactIcon), <></>],
            cancelButtonIndex: items.length,
            ...actionSheetStyles(theme),
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
  setImageDimensions, // tag,
}: RenderItemInfo<AppBskyEmbedImages.ViewImage> & { tag?: string }) => {
  const queryClient = useQueryClient();
  const frame = useSafeAreaFrame();
  const insets = useSafeAreaInsets();

  const size =
    queryClient.getQueryData<{
      width: number;
      height: number;
    }>(["image", item.fullsize, "size"]) ?? item.aspectRatio;

  const imageAspectRatio = size ? size?.width / size?.height : 1;
  const frameAspectRatio =
    (frame.width - insets.left - insets.right) /
    (frame.height - insets.top - insets.bottom);

  let width, flex;

  if (imageAspectRatio > frameAspectRatio) {
    width = "100%" as const;
  } else {
    flex = 1;
  }

  return (
    <>
      <AnimatedImage
        // sharedTransitionTag={tag}
        // weird postitioning
        // placeholder={{
        //   width: size.data?.width,
        //   height: size.data?.height,
        //   uri: item.thumb,
        // }}
        source={{ uri: item.fullsize }}
        alt={item.alt}
        style={[
          size
            ? { aspectRatio: size.width / size.height, width, flex }
            : { width: "100%" },
        ]}
        onLoad={({ source: { width, height } }) => {
          setImageDimensions({
            width,
            height,
          });
          if (!size) {
            queryClient.setQueryData(["image", item.fullsize, "size"], {
              width,
              height,
            });
          }
        }}
      />
    </>
  );
};
