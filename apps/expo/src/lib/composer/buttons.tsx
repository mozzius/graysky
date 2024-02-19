import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  Keyboard,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Link, useFocusEffect, useRouter } from "expo-router";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import {
  CheckIcon,
  GlobeIcon,
  SendIcon,
  Trash2Icon,
} from "lucide-react-native";

import { BackButtonOverride } from "~/components/back-button-override";
import { Text } from "~/components/themed/text";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { useHaptics } from "../hooks/preferences";
import { cx } from "../utils/cx";
import { useComposerState } from "./state";

export const PostButton = ({
  onPress,
  loading,
  disabled,
}: {
  onPress: (number?: number) => void;
  loading: boolean;
  disabled: boolean;
}) => {
  const theme = useTheme();
  const ref = useRef<TouchableWithoutFeedback>(null);
  const [{ threadgate }] = useComposerState();

  return (
    <View className="flex-row items-center">
      <Link href="/composer/threadgate" asChild>
        <TouchableOpacity className="relative mr-5 rounded-full p-1">
          <GlobeIcon size={24} color={theme.colors.primary} />
          {threadgate.length > 0 && (
            <CheckIcon
              size={16}
              color={theme.colors.primary}
              className="absolute -right-2 -top-0.5"
            />
          )}
        </TouchableOpacity>
      </Link>
      <TouchableWithoutFeedback
        ref={ref}
        disabled={disabled}
        onPress={() =>
          onPress((ref?.current && findNodeHandle(ref.current)) ?? undefined)
        }
      >
        <View
          className={cx(
            "relative flex-row items-center overflow-hidden rounded-full px-4 py-1",
            disabled && !loading && "opacity-50",
          )}
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="mr-2 text-base font-medium text-white">
            <Trans>Post</Trans>
          </Text>
          <SendIcon size={12} className="text-white" />
          {loading && (
            <View
              className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <ActivityIndicator size="small" color="white" />
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export const CancelButton = ({
  hasContent,
  onCancel,
  disabled,
}: {
  hasContent: boolean;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();
  const ref = useRef<TouchableOpacity>(null);
  const [currentScreen, setCurrentScreen] = useState(false);
  const haptics = useHaptics();
  const { _ } = useLingui();

  useFocusEffect(
    useCallback(() => {
      setCurrentScreen(true);
      return () => setCurrentScreen(false);
    }, []),
  );

  const handleCancel = useCallback(async () => {
    haptics.impact();
    if (Platform.OS === "android") Keyboard.dismiss();
    const options = [_(msg`Discard post`), _(msg`Cancel`)];
    const icons = [
      <Trash2Icon key={0} size={24} className="text-red-500" />,
      <></>,
    ];
    const selected = await new Promise((resolve) => {
      showActionSheetWithOptions(
        {
          options,
          icons,
          anchor: (ref?.current && findNodeHandle(ref.current)) ?? undefined,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: 0,
          ...actionSheetStyles(theme),
        },
        (index) => resolve(index),
      );
    });
    switch (selected) {
      case 0:
        Platform.select({
          ios: () => router.push("../"),
          default: () =>
            router.canGoBack() ? router.back() : router.replace("/feeds"),
        })();
        break;
      // case 1:
      //   onSave();
      //   break;
      default:
        onCancel();
        break;
    }
  }, [haptics, onCancel, router, showActionSheetWithOptions, theme, _]);

  if (hasContent) {
    return (
      <>
        {currentScreen && <BackButtonOverride dismiss={handleCancel} />}
        <TouchableOpacity
          ref={ref}
          disabled={disabled}
          accessibilityLabel={_(msg`Discard post`)}
          onPress={handleCancel}
        >
          <Text primary className="text-lg">
            <Trans>Cancel</Trans>
          </Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <Link href="../" asChild>
      <TouchableOpacity accessibilityRole="link">
        <Text primary className="text-lg">
          <Trans>Cancel</Trans>
        </Text>
      </TouchableOpacity>
    </Link>
  );
};
