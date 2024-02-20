import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";

import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { useCanGoBack } from "~/lib/hooks/can-go-back";

export default function AuthLayout() {
  const router = useRouter();
  const canGoBack = useCanGoBack("(auth)");
  const { _ } = useLingui();

  const headerLeft =
    Platform.OS === "ios" && !canGoBack
      ? () => (
          <Animated.View entering={FadeIn}>
            <TouchableOpacity
              onPress={() => router.push("../")}
              accessibilityRole="link"
            >
              <Text primary className="text-lg">
                <Trans>Cancel</Trans>
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
            title: _(msg`Sign up`),
          }}
        />
        <Stack.Screen
          name="sign-in"
          options={{
            title: _(msg`Log in`),
          }}
        />
        <Stack.Screen
          name="reset-password"
          options={{
            title: _(msg`Reset password`),
          }}
        />
        <Stack.Screen
          name="resume"
          options={{
            title: _(msg`Log back in`),
          }}
        />
      </Stack>
    </>
  );
}
