import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/text";
import { useCanGoBack } from "~/lib/hooks/can-go-back";

export default function AuthLayout() {
  const theme = useTheme();
  const router = useRouter();
  const canGoBack = useCanGoBack("(auth)");

  const headerLeft =
    Platform.OS === "ios" && !canGoBack
      ? () => (
          <Animated.View entering={FadeIn}>
            <TouchableOpacity onPress={() => router.push("../")}>
              <Text style={{ color: theme.colors.primary }} className="text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )
      : undefined;

  return (
    <>
      <StatusBar modal />
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
          headerLeft,
        }}
      >
        <Stack.Screen
          name="sign-up"
          options={{
            title: "Sign up",
          }}
        />
        <Stack.Screen
          name="sign-in"
          options={{
            title: "Log in",
          }}
        />
        <Stack.Screen
          name="reset-password"
          options={{
            title: "Reset password",
          }}
        />
        <Stack.Screen
          name="waitlist"
          options={{
            title: "Join the waitlist",
          }}
        />
        <Stack.Screen
          name="resume"
          options={{
            title: "Log back in",
          }}
        />
      </Stack>
    </>
  );
}
