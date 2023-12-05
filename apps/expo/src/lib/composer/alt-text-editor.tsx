import { useRef, useState } from "react";
import {
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useSafeAreaFrame } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTheme } from "@react-navigation/native";

import { Text } from "~/components/text";
import { useHaptics } from "../hooks/preferences";
import { PostButton } from "./buttons";
import { type ImageWithAlt } from "./utils";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Props {
  image: ImageWithAlt;
  editingAltText: number;
  setEditingAltText: (index: number | null) => void;
  addAltText: (index: number, alt: string) => void;
  keyboardHeight: number;
}

export const AltTextEditor = ({
  setEditingAltText,
  editingAltText,
  image,
  addAltText,
  keyboardHeight,
}: Props) => {
  const theme = useTheme();
  const haptics = useHaptics();
  const [expandPreview, setExpandPreview] = useState(false);
  const frame = useSafeAreaFrame();
  const headerHeight = useHeaderHeight();
  const altTextScrollViewRef = useRef<KeyboardAwareScrollView>(null);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <Stack.Screen
        options={{
          headerTitle: "Edit alt text",
          headerLeft: () => null,
          headerRight: () => (
            <View className="relative justify-center">
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setEditingAltText(null);
                  setExpandPreview(false);
                }}
                className="absolute right-0"
              >
                <Text
                  style={{ color: theme.colors.primary }}
                  className="text-lg font-medium"
                >
                  Done
                </Text>
              </TouchableOpacity>
              <View className="-z-50 opacity-0" pointerEvents="none">
                <PostButton
                  disabled
                  loading={false}
                  onPress={() => {
                    throw Error("unreachable");
                  }}
                />
              </View>
            </View>
          ),
          headerTitleStyle: { color: theme.colors.text },
        }}
      />
      <KeyboardAwareScrollView
        className="flex-1 px-4"
        extraHeight={32}
        extraScrollHeight={64}
        keyboardShouldPersistTaps="handled"
        ref={altTextScrollViewRef}
      >
        <View className="flex-1 items-center py-4">
          <TouchableWithoutFeedback
            className="flex-1"
            accessibilityLabel="Toggle expanding the image to full width"
            onPress={() => {
              haptics.impact();
              setExpandPreview((currentlyExpanded) => {
                if (!currentlyExpanded)
                  setTimeout(
                    () => altTextScrollViewRef.current?.scrollToEnd(),
                    250,
                  );
                return !currentlyExpanded;
              });
            }}
          >
            <AnimatedImage
              // doesn't work yet but on the reanimated roadmap
              // sharedTransitionTag={`image-${editingAltText}`}
              layout={LinearTransition}
              entering={FadeIn}
              cachePolicy="memory"
              source={{ uri: image.asset.uri }}
              alt={image.alt ?? `image ${editingAltText + 1}`}
              className="h-full w-full flex-1 rounded-md"
              style={{
                aspectRatio: image.asset.width / image.asset.height,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
                maxHeight: expandPreview
                  ? undefined
                  : frame.height - headerHeight - keyboardHeight - 100,
              }}
            />
          </TouchableWithoutFeedback>
        </View>
        <Animated.View
          className="flex-1"
          layout={LinearTransition}
          entering={FadeIn}
        >
          <TextInput
            value={image.alt}
            onChange={(evt) => addAltText(editingAltText, evt.nativeEvent.text)}
            multiline
            className="min-h-[80px] flex-1 rounded-md p-2 text-base leading-5"
            numberOfLines={5}
            autoFocus
            scrollEnabled={false}
            keyboardAppearance={theme.dark ? "dark" : "light"}
            placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
            style={{
              color: theme.colors.text,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
            }}
            textAlignVertical="top"
            placeholder="Add a description to the image. Good alt text is concise yet detailed. Make sure to write out any text in the image itself."
          />
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
};
