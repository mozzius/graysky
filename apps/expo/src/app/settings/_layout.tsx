import { Platform, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { useCanGoBack } from "~/lib/hooks/can-go-back";

export default function SettingsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const canGoBack = useCanGoBack("settings");

  return (
    <>
      <StatusBar modal />
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
          ...Platform.select({
            ios: {
              headerRight: () =>
                canGoBack || (
                  <Animated.View entering={FadeIn}>
                    <TouchableOpacity onPress={() => router.push("../")}>
                      <Text primary className="text-lg font-medium">
                        Done
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ),
            },
            android: {
              animation: "ios",
            },
          }),
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "設定",
            headerLargeTitle: true,
            headerLargeTitleShadowVisible: false,
            headerLargeStyle: {
              backgroundColor: theme.colors.background,
            },
          }}
        />
        <Stack.Screen
          name="pro"
          options={{
            title: "Proの設定",
          }}
        />
        <Stack.Screen
          name="account/index"
          options={{
            title: "アカウントの設定",
          }}
        />
        <Stack.Screen
          name="account/change-handle"
          options={{
            title: "ハンドルを変更",
          }}
        />
        <Stack.Screen
          name="account/change-password"
          options={{
            title: "パスワードを変更",
          }}
        />
        <Stack.Screen
          name="account/delete-account"
          options={{
            title: "アカウントを削除",
          }}
        />
        <Stack.Screen
          name="moderation"
          options={{
            title: "モデレーション",
          }}
        />
        <Stack.Screen
          name="blocks"
          options={{
            title: "ブロックをしたユーザー",
          }}
        />
        <Stack.Screen
          name="mutes"
          options={{
            title: "ミュートをしたユーザー",
          }}
        />
        <Stack.Screen
          name="app"
          options={{
            title: "アプリの設定",
          }}
        />
        <Stack.Screen
          name="feed"
          options={{
            title: "ホームフィードの設定",
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: "アプリについて",
          }}
        />
        <Stack.Screen
          name="language/index"
          options={{
            title: "言語",
          }}
        />
        <Stack.Screen
          name="language/primary"
          options={{
            title: "プライマリの言語",
          }}
        />
        <Stack.Screen
          name="language/content"
          options={{
            title: "コンテンツの言語",
          }}
        />
      </Stack>
    </>
  );
}
