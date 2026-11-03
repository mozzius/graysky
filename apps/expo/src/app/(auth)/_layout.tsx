import { Stack, useRouter } from "expo-router";
import {
  type NavigationProp,
  type ParamListBase,
} from "expo-router/react-navigation";
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
        screenOptions={({ navigation, route }) => {
          // only the first screen in this stack gets a close button. screens
          // pushed on top of it keep the native back button
          const { routes } = (
            navigation as NavigationProp<ParamListBase>
          ).getState();
          const isFirstScreen = routes[0]?.key === route.key;
          return {
            headerBackButtonDisplayMode: isIOS26 ? "minimal" : "default",
            // for the first screen, `canGoBack` comes from the root stack, so
            // it's true when the modal has a screen under it to close to
            unstable_headerLeftItems: ({ canGoBack }) =>
              isFirstScreen && canGoBack
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
          };
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
