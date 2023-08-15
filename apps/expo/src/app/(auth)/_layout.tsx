import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";

import { StatusBar } from "../../components/status-bar";
import { Text } from "../../components/text";
import { useCanGoBack } from "../../lib/hooks/can-go-back";

export default function AuthLayout() {
  const router = useRouter();
  const canGoBack = useCanGoBack("(auth)");

  return (
    <>
      <StatusBar modal />
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
          headerLeft:
            canGoBack || Platform.OS === "android"
              ? undefined
              : () => (
                  <Animated.View entering={FadeIn}>
                    <TouchableOpacity onPress={() => router.push("../")}>
                      <Text className="text-lg">Cancel</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ),
        }}
      >
        <Stack.Screen
          name="sign-up"
          options={{
            title: "Sign up",
          }}
        />
        <Stack.Screen
          name="login"
          options={{
            title: "Login",
          }}
        />
        <Stack.Screen
          name="reset-password"
          options={{
            title: "Reset Password",
          }}
        />
        <Stack.Screen
          name="waitlist"
          options={{
            title: "Join the Waitlist",
          }}
        />
      </Stack>
    </>
  );
}
