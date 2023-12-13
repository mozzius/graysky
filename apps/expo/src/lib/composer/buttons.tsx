import { useRef } from "react";
import {
  ActivityIndicator,
  findNodeHandle,
  Keyboard,
  Platform,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { SendIcon, Trash2Icon } from "lucide-react-native";

import { BackButtonOverride } from "~/components/back-button-override";
import { Text } from "~/components/themed/text";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { useHaptics } from "../hooks/preferences";
import { cx } from "../utils/cx";

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

  return (
    <View className="flex-row items-center">
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
          <Text className="mr-2 text-base font-medium text-white">Post</Text>
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
  onSave,
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

  const haptics = useHaptics();

  const handleCancel = async () => {
    haptics.impact();
    if (Platform.OS === "android") Keyboard.dismiss();
    const options = ["Discard post", "Cancel"];
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
        (index) => resolve(options[index!]),
      );
    });
    switch (selected) {
      case "Discard post":
        Platform.select({
          ios: () => router.push("../"),
          default: () =>
            router.canGoBack() ? router.back() : router.replace("/feeds"),
        })();
        break;
      case "Save to drafts":
        onSave();
        break;
      default:
        onCancel();
        break;
    }
  };

  if (hasContent) {
    return (
      <>
        <BackButtonOverride dismiss={handleCancel} />
        <TouchableOpacity
          ref={ref}
          disabled={disabled}
          accessibilityLabel="Discard post"
          onPress={() => void handleCancel()}
        >
          <Text style={{ color: theme.colors.primary }} className="text-lg">
            Cancel
          </Text>
        </TouchableOpacity>
      </>
    );
  }

  return (
    <Link href="../" asChild>
      <TouchableOpacity accessibilityRole="link">
        <Text style={{ color: theme.colors.primary }} className="text-lg">
          Cancel
        </Text>
      </TouchableOpacity>
    </Link>
  );
};
