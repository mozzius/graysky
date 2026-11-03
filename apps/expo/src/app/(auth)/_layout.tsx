import { Stack, useRouter } from "expo-router";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { StatusBar } from "~/components/status-bar";
import { isIOS26 } from "~/lib/utils/version";

export default function AuthLayout() {
  const router = useRouter();
  const { _ } = useLingui();

  return (
    <>
      <StatusBar modal />
      <Stack
        screenOptions={{
          headerBackButtonDisplayMode: isIOS26 ? "minimal" : "default",
          unstable_headerLeftItems: ({ canGoBack }) =>
            canGoBack
              ? [
                  {
                    type: "button",
                    icon: { type: "sfSymbol", name: "xmark" },
                    label: _(msg`Close`),
                    onPress: () => router.dismiss(),
                  },
                ]
              : [],
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
          name="reauth"
          options={{
            title: "",
            headerTransparent: true,
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
