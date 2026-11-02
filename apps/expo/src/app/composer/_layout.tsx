import { useMemo, useState } from "react";
import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";

import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import {
  ComposerStateProvider,
  type ComposerState,
} from "~/lib/composer/state";
import {
  useMostRecentLanguage,
  usePrimaryLanguage,
} from "~/lib/storage/app-preferences";
import { isIOS26 } from "~/lib/utils/version";

export default function ComposerLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { initialText, reply, quote } = useGlobalSearchParams<{
    initialText: string;
    reply: string;
    quote: string;
  }>();
  const mostRecentLanguage = useMostRecentLanguage();
  const primaryLanguage = usePrimaryLanguage();
  const { _ } = useLingui();

  const state = useState<ComposerState>({
    labels: [],
    languages: [mostRecentLanguage ?? primaryLanguage],
    initialText: initialText,
    reply,
    quote,
    threadgate: [],
  });

  const headerRight = useMemo(
    () =>
      Platform.select({
        ios: () => (
          <Animated.View entering={FadeIn}>
            <TouchableOpacity onPress={() => router.push("../")}>
              <Text primary className="text-lg font-medium">
                <Trans>Done</Trans>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ),
      }),
    [router],
  );

  const headerItemsRight = () => [
    {
      type: "button",
      onPress: () => router.dismiss(),
      label: _(msg`Close`),
      icon: { type: "sfSymbol", name: "xmark" },
    },
  ];

  return (
    <ComposerStateProvider value={state}>
      <BottomSheetModalProvider>
        <StatusBar modal />
        <Stack
          screenOptions={{
            headerBackButtonDisplayMode: isIOS26 ? "minimal" : "default",
            animationMatchesGesture: true,
            contentStyle: {
              height: "100%",
            },
          }}
        >
          <Stack.Screen
            name="index"
            options={{ title: _(msg`New Post`), headerTitle: "" }}
          />
          <Stack.Screen name="drafts" options={{ title: _(msg`Drafts`) }} />
          <Stack.Screen
            name="language"
            options={{ title: _(msg`Post Language`) }}
          />
          <Stack.Screen
            name="content-warning"
            options={{
              title: _(msg`Content Warning`),
              presentation: "formSheet",
              ...(isIOS26
                ? { unstable_headerItemsRight: headerItemsRight }
                : { headerRight }),
            }}
          />
          <Stack.Screen
            name="threadgate"
            options={{
              title: _(msg`Reply Controls`),
              presentation: "formSheet",
              ...(Platform.OS === "ios"
                ? {
                    sheetGrabberVisible: true,
                    sheetAllowedDetents: [0.5, 1.0],
                  }
                : { headerRight }),
            }}
          />
          <Stack.Screen
            name="gifs"
            options={{
              title: _(msg`GIFs`),
              headerSearchBarOptions: {},
              headerLargeTitle: true,
              headerLargeTitleShadowVisible: !isIOS26,
              headerTransparent: isIOS26,
              headerLargeStyle: {
                backgroundColor: isIOS26 ? "transparent" : theme.colors.card,
              },
              presentation: "modal",
              ...(isIOS26
                ? { unstable_headerItemsRight: headerItemsRight }
                : { headerRight }),
            }}
          />
        </Stack>
      </BottomSheetModalProvider>
    </ComposerStateProvider>
  );
}
