import { StyleSheet, View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@react-navigation/native";
import colors from "tailwindcss/colors";

import { Text } from "~/components/text";
import { cx } from "../utils/cx";
import { MAX_LENGTH } from "./utils";

interface Props {
  charCount?: number;
  children?: React.ReactNode;
}

export const KeyboardAccessory = ({ charCount = 0, children }: Props) => {
  const theme = useTheme();
  const keyboard = useAnimatedKeyboard();
  const { bottom } = useSafeAreaInsets();
  const translateStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: Math.min(-keyboard.height.value, -bottom) }],
    };
  });

  const tooLong = charCount > MAX_LENGTH;

  const progress = ((charCount / MAX_LENGTH) * 100) % 100;

  return (
    <Animated.View
      style={translateStyle}
      className="absolute bottom-0 w-full flex-1"
    >
      <View
        className="h-12 flex-1 flex-row items-center px-2"
        style={{
          borderTopWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        }}
      >
        <View className="flex-1 flex-row items-center justify-start gap-2">
          {children}
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
          fill={progress}
          size={28}
          width={5}
          rotation={0}
          backgroundColor={
            theme.dark ? colors.neutral[800] : theme.colors.background
          }
          tintColor={
            !tooLong ? theme.colors.primary : theme.colors.notification
          }
        />
      </View>
    </Animated.View>
  );
};
