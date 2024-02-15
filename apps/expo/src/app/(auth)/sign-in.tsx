import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { showToastable } from "react-native-toastable";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { LockIcon, ShieldAlertIcon, UserIcon } from "lucide-react-native";
import { z } from "zod";

import KeyboardAwareScrollView from "~/components/scrollview/keyboard-aware-scrollview";
import { TextButton } from "~/components/text-button";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { useLinkPress } from "~/lib/hooks/link-press";

export default function SignIn() {
  const agent = useAgent();
  const router = useRouter();
  const theme = useTheme();
  const { handle } = useLocalSearchParams<{ handle?: string }>();
  const { openLink, showLinkOptions } = useLinkPress();

  const [identifier, setIdentifier] = useState(handle ?? "");
  const [password, setPassword] = useState("");
  const [hasFocusedPassword, setHasFocusedPassword] = useState(false);

  const login = useMutation({
    mutationKey: ["login"],
    mutationFn: async () => {
      await agent.login({
        identifier: identifier.startsWith("@")
          ? identifier.slice(1).trim()
          : identifier.trim(),
        password,
      });
    },
    onSuccess: () => router.replace("/(feeds)/feeds"),
    onError: (err) =>
      showToastable({
        title: "ログインできませんでした",
        message: err instanceof Error ? err.message : "不明なエラー",
        status: "warning",
      }),
  });

  return (
    <TransparentHeaderUntilScrolled>
      <KeyboardAwareScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="flex-1 p-4"
      >
        <Stack.Screen options={{ headerRight: () => null }} />
        <View className="items-stretch gap-4">
          <View
            className="flex-row items-center rounded-lg pl-3"
            style={{ backgroundColor: theme.colors.card }}
          >
            <UserIcon size={18} color="rgb(163 163 163)" />
            <TextInput
              className="flex-1 flex-row items-center px-2 py-3 text-base leading-5"
              placeholder="ユーザー名またはメールアドレス"
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              onBlur={() => {
                let fixed = identifier;
                if (identifier.startsWith("@")) fixed = identifier.slice(1);
                if (!identifier.includes(".") && identifier.length > 0)
                  fixed = `${fixed}.bsky.social`;
                setIdentifier(fixed);
              }}
              autoFocus
            />
          </View>
          <View
            className="flex-row items-center rounded-lg pl-3"
            style={{ backgroundColor: theme.colors.card }}
          >
            <LockIcon size={18} color="rgb(163 163 163)" />
            <TextInput
              className="flex-1 flex-row items-center px-2 py-3 text-base leading-5"
              placeholder="アプリパスワード"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setHasFocusedPassword(true)}
            />
            <TextButton
              onPress={() => {
                if (z.string().email().safeParse(identifier).success) {
                  router.push("/reset-password?email=" + identifier);
                } else {
                  router.push("/reset-password");
                }
              }}
              title="忘れましたか?"
              className="pr-3 text-sm"
            />
          </View>
          {hasFocusedPassword && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              className="flex-row rounded border-blue-500 bg-blue-50 p-3 pb-4 dark:bg-blue-950"
              style={{
                borderWidth: StyleSheet.hairlineWidth,
              }}
            >
              <ShieldAlertIcon
                size={18}
                className="mt-px"
                color={theme.colors.text}
              />
              <View className="ml-3 flex-1">
                <Text className="text-base font-medium leading-5">
                  アプリパスワード
                </Text>
                <Text className="mt-1">
                  メインパスワードではなくアプリパスワードを使用する事を推奨します。
                  -これはアカウントの安全性を保つために役立ちますが、必須ではありません。
                </Text>
                <Text
                  className="mt-2"
                  primary
                  accessibilityRole="link"
                  onPress={() =>
                    openLink("https://bsky.app/settings/app-passwords")
                  }
                  onLongPress={() =>
                    showLinkOptions("https://bsky.app/settings/app-passwords")
                  }
                >
                  bsky.app/設定で作成をします
                </Text>
              </View>
            </Animated.View>
          )}
          <Animated.View
            className="flex-row items-center justify-between pt-1"
            layout={LinearTransition}
          >
            <TextButton
              onPress={() => router.push("/sign-up")}
              title="サインアップ"
            />
            {!login.isPending ? (
              <TextButton
                disabled={!identifier || !password}
                onPress={() => login.mutate()}
                title="ログイン"
                className="font-medium"
              />
            ) : (
              <ActivityIndicator className="px-2" />
            )}
          </Animated.View>
        </View>
      </KeyboardAwareScrollView>
    </TransparentHeaderUntilScrolled>
  );
}
