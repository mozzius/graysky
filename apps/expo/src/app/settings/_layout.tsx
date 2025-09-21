import { Platform, Pressable, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { XIcon } from "lucide-react-native";

import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { useCanGoBack } from "~/lib/hooks/can-go-back";
import { isIOS26 } from "~/lib/utils/version";

export default function SettingsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const canGoBack = useCanGoBack("settings");
  const { _ } = useLingui();

  return (
    <>
      <StatusBar modal />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: isIOS26 ? "minimal" : "default",
          ...Platform.select({
            ios: {
              headerLeft: () =>
                !canGoBack ? (
                  <Pressable
                    onPress={() => router.dismiss()}
                    className="ml-1.5"
                  >
                    <XIcon size={24} color={theme.colors.text} />
                  </Pressable>
                ) : undefined,
            },
          }),
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: _(msg`Settings`),
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: !isIOS26,
            headerTransparent: isIOS26,
            headerLargeStyle: {
              backgroundColor: isIOS26
                ? "transparent"
                : theme.colors.background,
            },
          }}
        />
        <Stack.Screen
          name="pro"
          options={{
            title: _(msg`Pro Settings`),
          }}
        />
        <Stack.Screen
          name="account/index"
          options={{
            title: _(msg`Account Settings`),
          }}
        />
        <Stack.Screen
          name="account/change-handle"
          options={{
            title: _(msg`Change Handle`),
          }}
        />
        <Stack.Screen
          name="account/change-password"
          options={{
            title: _(msg`Change Password`),
          }}
        />
        <Stack.Screen
          name="account/delete-account"
          options={{
            title: _(msg`Delete Account`),
          }}
        />
        <Stack.Screen
          name="moderation"
          options={{
            title: _(msg`Moderation`),
          }}
        />
        <Stack.Screen
          name="blocks"
          options={{
            title: _(msg`Blocked Users`),
          }}
        />
        <Stack.Screen
          name="mutes"
          options={{
            title: _(msg`Muted Users`),
          }}
        />
        <Stack.Screen
          name="app"
          options={{
            title: _(msg`App Settings`),
          }}
        />
        <Stack.Screen
          name="feed"
          options={{
            title: _(msg`Home Feed Preferences`),
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: _(msg`About`),
          }}
        />
        <Stack.Screen
          name="language/index"
          options={{
            title: _(msg`Languages`),
          }}
        />
        <Stack.Screen
          name="language/primary"
          options={{
            title: _(msg`Primary Language`),
          }}
        />
        <Stack.Screen
          name="language/content"
          options={{
            title: _(msg`Content Languages`),
          }}
        />
      </Stack>
    </>
  );
}
