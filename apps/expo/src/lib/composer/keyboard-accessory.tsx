import { Platform, StyleSheet, TouchableHighlight, View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import { KeyboardStickyView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { LanguagesIcon, PaperclipIcon } from "lucide-react-native";
import colors from "tailwindcss/colors";

import { Menu } from "~/components/menu";
import { Text } from "~/components/themed/text";
import { useHaptics } from "../hooks/preferences";
import { cx } from "../utils/cx";
import { MAX_IMAGES, MAX_LENGTH } from "./utils";

interface Props {
  charCount?: number;
  onPressImage: (action: "camera" | "gallery") => void;
  onPressLanguage: () => void;
  language: string;
  imageCount: number;
}

export const KeyboardAccessory = ({
  charCount = 0,
  imageCount,
  onPressImage,
  onPressLanguage,
  language,
}: Props) => {
  const theme = useTheme();
  const haptics = useHaptics();
  const router = useRouter();
  const { _ } = useLingui();

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
        <View>
          <Menu
            onOpen={() => haptics.selection()}
            groups={[
              {
                key: "image",
                items: [
                  {
                    key: "camera",
                    label: _(msg`Take photo`),
                    icon: "camera",
                    disabled: imageCount >= MAX_IMAGES,
                    onSelect: () => onPressImage("camera"),
                  },
                  {
                    key: "gallery",
                    label: _(msg`Choose from Library`),
                    icon: "photo",
                    disabled: imageCount >= MAX_IMAGES,
                    onSelect: () => onPressImage("gallery"),
                  },
                  {
                    key: "gifs",
                    label: _(msg`Search GIFs`),
                    icon: "magnifyingglass",
                    disabled: imageCount > 0,
                    onSelect: () => router.push("/composer/gifs"),
                  },
                ],
              },
            ]}
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
              <Text primary className="ml-2.5 mr-1 font-medium">
                <Trans>Add image</Trans>
              </Text>
            </View>
          </Menu>
        </View>
        <TouchableHighlight
          className="rounded-full"
          accessibilityLabel={_(msg`Change post language`)}
          accessibilityRole="button"
          onPress={() => {
            haptics.selection();
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
            <Text primary className="ml-2.5 mr-1 font-medium uppercase">
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
        // theme colours are typed as ColorValue, but ours are always strings
        backgroundColor={
          theme.dark ? colors.neutral[800] : (theme.colors.background as string)
        }
        tintColor={
          (!tooLong
            ? theme.colors.primary
            : theme.colors.notification) as string
        }
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
        opened: 0,
      }}
    >
      {content}
    </KeyboardStickyView>
  );
};
