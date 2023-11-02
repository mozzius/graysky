import { useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { Avatar } from "~/components/avatar";
import { useDrawer } from "~/components/drawer/context";
import { useOptionalAgent } from "~/lib/agent";
import { useAppPreferences } from "~/lib/hooks/preferences";

const stackOptions = {
  screenOptions: {
    fullScreenGestureEnabled: true,
  },
};

export default function SubStack() {
  const openDrawer = useDrawer();
  const router = useRouter();
  const theme = useTheme();
  // agent might not be available yet
  const agent = useOptionalAgent();
  const [{ homepage }] = useAppPreferences();

  const headerLeft = useCallback(
    () => (
      <TouchableOpacity
        onPress={() => openDrawer()}
        className="mr-3"
        accessibilityHint="Open drawer menu"
      >
        <Avatar size="small" />
      </TouchableOpacity>
    ),
    [openDrawer],
  );

  if (!agent?.hasSession) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-base">Connecting...</Text>
      </View>
    );
  }

  return <Stack {...stackOptions} />;
}
