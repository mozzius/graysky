import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { useCanGoBack } from "~/lib/hooks/can-go-back";

export default function SettingsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const canGoBack = useCanGoBack("settings");

  return (
    <>
      <StatusBar modal />
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
          headerRight:
            canGoBack || Platform.OS === "android"
              ? undefined
              : () => (
                  <Animated.View entering={FadeIn}>
                    <TouchableOpacity onPress={() => router.push("../")}>
                      <Text
                        style={{ color: theme.colors.primary }}
                        className="text-lg font-medium"
                      >
                        Done
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ),
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Settings",
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
            headerLargeStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        />
        <Stack.Screen
          name="account/index"
          options={{
            title: "Account Settings",
          }}
        />
        <Stack.Screen
          name="account/edit-bio"
          options={{
            title: "Edit Profile",
          }}
        />
        <Stack.Screen
          name="account/change-handle"
          options={{
            title: "Change Handle",
          }}
        />
        <Stack.Screen
          name="account/change-password"
          options={{
            title: "Change Password",
          }}
        />
        <Stack.Screen
          name="account/delete-account"
          options={{
            title: "Delete Account",
          }}
        />
        <Stack.Screen
          name="moderation"
          options={{
            title: "Moderation",
          }}
        />
        <Stack.Screen
          name="blocks"
          options={{
            title: "Blocked Users",
          }}
        />
        <Stack.Screen
          name="mutes"
          options={{
            title: "Muted Users",
          }}
        />
        <Stack.Screen
          name="app"
          options={{
            title: "App Preferences",
          }}
        />
        <Stack.Screen
          name="feed"
          options={{
            title: "Home Feed Preferences",
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: "About",
          }}
        />
        <Stack.Screen
          name="language/index"
          options={{
            title: "Languages",
          }}
        />
        <Stack.Screen
          name="language/primary"
          options={{
            title: "Primary Language",
          }}
        />
        <Stack.Screen
          name="language/content"
          options={{
            title: "Content Languages",
          }}
        />
      </Stack>
    </>
  );
}
