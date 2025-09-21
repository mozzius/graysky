import { Platform, Pressable } from "react-native";
import { Stack, useRouter } from "expo-router";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { XIcon } from "lucide-react-native";

import { StatusBar } from "~/components/status-bar";
import { useCanGoBack } from "~/lib/hooks/can-go-back";
import { isIOS26 } from "~/lib/utils/version";

export default function AuthLayout() {
  const router = useRouter();
  const canGoBack = useCanGoBack("(auth)");
  const { _ } = useLingui();
  const theme = useTheme();

  const headerLeft =
    Platform.OS === "ios" && !canGoBack
      ? () => (
          <Pressable onPress={() => router.dismiss()} className="ml-1.5">
            <XIcon size={24} color={theme.colors.text} />
          </Pressable>
        )
      : undefined;

  return (
    <>
      <StatusBar modal />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: isIOS26 ? "minimal" : "default",
          headerLeft,
          contentStyle: {
            height: "100%",
          },
        }}
      >
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
