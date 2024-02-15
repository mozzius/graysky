import { useMemo, useState } from "react";
import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";

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

  return (
    <ComposerStateProvider value={state}>
      <BottomSheetModalProvider>
        <StatusBar modal />
        <Stack
          screenOptions={{
            customAnimationOnGesture: true,
            ...Platform.select({
              android: {
                animation: "ios",
              },
            }),
          }}
        >
          <Stack.Screen name="index" options={{ title: _(msg`New Post`) }} />
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
              headerRight,
            }}
          />
          <Stack.Screen
            name="threadgate"
            options={{
              title: _(msg`Reply Controls`),
              presentation: "formSheet",
              headerRight,
            }}
          />
          <Stack.Screen
            name="gifs"
            options={{
              title: _(msg`GIFs`),
              headerSearchBarOptions: {},
              headerLargeTitle: true,
              headerLargeTitleShadowVisible: false,
              headerLargeStyle: {
                backgroundColor: theme.colors.card,
              },
              presentation: "modal",
              headerRight,
            }}
          />
        </Stack>
      </BottomSheetModalProvider>
    </ComposerStateProvider>
  );
}
