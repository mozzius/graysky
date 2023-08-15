import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { LockIcon, ShieldAlertIcon, UserIcon } from "lucide-react-native";
import { z } from "zod";

import { Text } from "../../components/text";
import { TextButton } from "../../components/text-button";
import { useAgent } from "../../lib/agent";
import { cx } from "../../lib/utils/cx";

const appPwdRegex = /^[a-zA-Z\d]{4}-[a-zA-Z\d]{4}-[a-zA-Z\d]{4}-[a-zA-Z\d]{4}$/;

export default function Login() {
  const agent = useAgent();
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationKey: ["login"],
    mutationFn: async () => {
      await agent.login({
        identifier: identifier.startsWith("@")
          ? identifier.slice(1)
          : identifier,
        password,
      });
    },
    onError: (err) =>
      Alert.alert(
        "Could not log you in",
        err instanceof Error ? err.message : "Unknown error",
      ),
  });

  const theme = useTheme();

  return (
    <View
      className={cx("flex-1 px-4 pt-6", theme.dark ? "bg-black" : "bg-white")}
    >
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
        {password && !appPwdRegex.test(password) && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="flex-row rounded border-yellow-500 bg-yellow-50 p-3 pb-4 dark:bg-yellow-950"
            style={{
              borderWidth: StyleSheet.hairlineWidth,
            }}
          >
            <ShieldAlertIcon
              size={18}
              className="mt-0.5 text-yellow-800 dark:text-white"
            />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium leading-5 text-yellow-800 dark:text-white">
                Note: Not an App Password
              </Text>
              <Text className="mt-1">
                Consider using an App Password rather than your main password.
                This helps keep your account secure.
              </Text>
              <Text
                className="mt-2"
                onPress={() =>
                  void Linking.openURL(
                    "https://bsky.app/settings/app-passwords",
                  )
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
