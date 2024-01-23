import { useMemo, useState } from "react";
import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useGlobalSearchParams, useRouter } from "expo-router";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";

import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import {
  ComposerStateProvider,
  type ComposerState,
} from "~/lib/composer/state";
import { useAppPreferences } from "~/lib/hooks/preferences";

export default function ComposerLayout() {
  const theme = useTheme();
  const router = useRouter();
  const { initialText, reply, quote } = useGlobalSearchParams<{
    initialText: string;
    reply: string;
    quote: string;
  }>();
  const [{ mostRecentLanguage, primaryLanguage }] = useAppPreferences();

  const state = useState<ComposerState>({
    labels: [],
    languages: [mostRecentLanguage ?? primaryLanguage],
    initialText: initialText,
    reply,
    quote,
  });

  const headerRight = useMemo(
    () =>
      Platform.select({
        ios: () => (
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
      }),
    [router, theme.colors.primary],
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
          <Stack.Screen name="index" options={{ title: "New Post" }} />
          <Stack.Screen name="drafts" options={{ title: "Drafts" }} />
          <Stack.Screen name="language" options={{ title: "Post Language" }} />
          <Stack.Screen
            name="content-warning"
            options={{
              title: "Content Warning",
              presentation: "formSheet",
              headerRight,
            }}
          />
          <Stack.Screen
            name="gifs"
            options={{
              title: "GIFs",
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
