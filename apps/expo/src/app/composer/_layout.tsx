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
                Done
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
          <Stack.Screen name="index" options={{ title: "新しい投稿" }} />
          <Stack.Screen name="drafts" options={{ title: "ドラフト" }} />
          <Stack.Screen name="language" options={{ title: "投稿の言語" }} />
          <Stack.Screen
            name="content-warning"
            options={{
              title: "コンテンツ警告",
              presentation: "formSheet",
              headerRight,
            }}
          />
          <Stack.Screen
            name="threadgate"
            options={{
              title: "返信のコントロール",
              presentation: "formSheet",
              headerRight,
            }}
          />
          <Stack.Screen
            name="gifs"
            options={{
              title: "GIF",
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
