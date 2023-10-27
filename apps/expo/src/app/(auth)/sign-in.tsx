import { useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { showToastable } from "react-native-toastable";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { LockIcon, ShieldAlertIcon, UserIcon } from "lucide-react-native";
import { z } from "zod";

import { Text } from "~/components/text";
import { TextButton } from "~/components/text-button";
import { useAgent } from "~/lib/agent";
import { useLinkPress } from "~/lib/hooks/link-press";
import { cx } from "~/lib/utils/cx";

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
    onSuccess: () => router.push("../"),
    onError: (err) =>
      showToastable({
        title: "Could not log you in",
        message: err instanceof Error ? err.message : "Unknown error",
        status: "warning",
      }),
  });

  return (
    <View
      className={cx("flex-1 px-4 pt-6", theme.dark ? "bg-black" : "bg-white")}
    >
      <Stack.Screen options={{ headerRight: () => null }} />
      <View className="items-stretch gap-4">
        <View
          className={cx(
            "flex-row items-center rounded pl-3",
            !theme.dark && "border-neutral-400",
          )}
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            backgroundColor: theme.colors.card,
          }}
        >
          <UserIcon size={18} color="rgb(163 163 163)" />
          <TextInput
            style={{ color: theme.colors.text }}
            className="ml-2 flex-1 overflow-visible py-3 text-base leading-5"
            placeholder="Username or email address"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
            onBlur={() => {
              let fixed = identifier;
              if (identifier.startsWith("@")) fixed = identifier.slice(1);
              if (!identifier.includes(".") && identifier.length > 0)
                fixed = `${fixed}.bsky.social`;
              setIdentifier(fixed);
            }}
            autoFocus
            keyboardAppearance={theme.dark ? "dark" : "light"}
          />
        </View>
        <View
          className={cx(
            "flex-row items-center rounded pl-3",
            !theme.dark && "border-neutral-400",
          )}
          style={{
            borderWidth: StyleSheet.hairlineWidth,
            backgroundColor: theme.colors.card,
          }}
        >
          <LockIcon size={18} color="rgb(163 163 163)" />
          <TextInput
            style={{ color: theme.colors.text }}
            className="mx-2 flex-1 overflow-visible py-3 text-base leading-5"
            placeholder="App Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
            keyboardAppearance={theme.dark ? "dark" : "light"}
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
            title="Forgot?"
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
                App Passwords
              </Text>
              <Text className="mt-1">
                You might want to use an App Password rather than your main
                password - this helps keep you account secure, but will disable
                certain features such as viewing your invite codes.
              </Text>
              <Text
                className="mt-2"
                style={{ color: theme.colors.primary }}
                accessibilityRole="link"
                onPress={() =>
                  openLink("https://bsky.app/settings/app-passwords")
                }
                onLongPress={() =>
                  showLinkOptions("https://bsky.app/settings/app-passwords")
                }
              >
                Create one at bsky.app/settings
              </Text>
            </View>
          </Animated.View>
        )}
        <Animated.View
          className="flex-row items-center justify-between pt-1"
          layout={Layout}
        >
          <TextButton onPress={() => router.push("/sign-up")} title="Sign up" />
          {!login.isLoading ? (
            <TextButton
              disabled={!identifier || !password}
              onPress={() => login.mutate()}
              title="Log in"
              className="font-medium"
            />
          ) : (
            <ActivityIndicator className="px-2" />
          )}
        </Animated.View>
      </View>
    </View>
  );
}
