import { Platform, StyleSheet, TouchableHighlight, View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import { LanguagesIcon, PaperclipIcon } from "lucide-react-native";
import colors from "tailwindcss/colors";

import { Text } from "~/components/themed/text";
import { useHaptics } from "../hooks/preferences";
import { cx } from "../utils/cx";
import { MAX_LENGTH } from "./utils";

interface Props {
  charCount?: number;
  onPressImage: () => void;
  onPressLanguage: () => void;
  language: string;
  imageButtonRef?: React.RefObject<TouchableHighlight>;
}

export const KeyboardAccessory = ({
  charCount = 0,
  onPressImage,
  onPressLanguage,
  language,
  imageButtonRef,
}: Props) => {
  const theme = useTheme();
  const haptics = useHaptics();

  const tooLong = charCount > MAX_LENGTH;
  const progress = (charCount / MAX_LENGTH) * 100;

  const { bottom } = useSafeAreaInsets();

  const content = (
    <View
      className="flex-1 flex-row items-center px-2"
      style={{
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.card,
      }}
    >
      <View className="flex-1 flex-row items-center justify-start gap-2">
        <TouchableHighlight
          ref={imageButtonRef}
          className="rounded-full"
          accessibilityLabel="Add image or GIF"
          accessibilityRole="button"
          onPress={() => {
            haptics.impact();
            onPressImage();
          }}
        >
          <View
            className="h-9 flex-row items-center justify-center rounded-full px-2.5"
            style={{
              backgroundColor: theme.dark
                ? colors.neutral[800]
                : theme.colors.background,
            }}
          >
            <PaperclipIcon size={20} color={theme.colors.primary} />
            <Text
              style={{ color: theme.colors.primary }}
              className="ml-2.5 mr-1 font-medium"
            >
              Add image
            </Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          className="rounded-full"
          accessibilityLabel="Add image or GIF"
          accessibilityRole="button"
          onPress={() => {
            haptics.impact();
            onPressLanguage();
          }}
        >
          <View
            className="h-9 flex-row items-center justify-center rounded-full px-2.5"
            style={{
              backgroundColor: theme.dark
                ? colors.neutral[800]
                : theme.colors.background,
            }}
          >
            <LanguagesIcon size={20} color={theme.colors.primary} />
            <Text
              style={{ color: theme.colors.primary }}
              className="ml-2.5 mr-1 font-medium uppercase"
            >
              {language}
            </Text>
          </View>
        </TouchableHighlight>
      </View>
      <Text className="mx-3 text-right">
        <Text
          style={{
            color: tooLong ? theme.colors.notification : undefined,
          }}
          className={cx(tooLong && "font-medium")}
        >
          {charCount}
        </Text>{" "}
        / {MAX_LENGTH}
      </Text>
      <AnimatedCircularProgress
        fill={tooLong ? progress % 100 : progress}
        size={28}
        width={5}
        rotation={0}
        backgroundColor={
          theme.dark ? colors.neutral[800] : theme.colors.background
        }
        tintColor={!tooLong ? theme.colors.primary : theme.colors.notification}
      />
    </View>
  );

  if (Platform.OS === "ios" && Platform.isPad) {
    return <View className="h-12 w-full">{content}</View>;
  }

  return (
    <KeyboardStickyView
      className="h-12 w-full"
      offset={{
        closed: -bottom,
      }}
    >
      {content}
    </KeyboardStickyView>
  );
};
