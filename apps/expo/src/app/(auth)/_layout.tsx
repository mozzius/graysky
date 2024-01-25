import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";

import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { useCanGoBack } from "~/lib/hooks/can-go-back";

export default function AuthLayout() {
  const router = useRouter();
  const canGoBack = useCanGoBack("(auth)");

  const headerLeft =
    Platform.OS === "ios" && !canGoBack
      ? () => (
          <Animated.View entering={FadeIn}>
            <TouchableOpacity
              onPress={() => router.push("../")}
              accessibilityRole="link"
            >
              <Text primary className="text-lg">
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
          ...Platform.select({
            android: {
              animation: "ios",
            },
          }),
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
