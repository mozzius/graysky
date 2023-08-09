import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut, Layout } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangleIcon, LockIcon, UserIcon } from "lucide-react-native";

import { TextButton } from "../../components/text-button";
import { useAgent } from "../../lib/agent";
import { cx } from "../../lib/utils/cx";

const appPwdRegex = /^[a-zA-Z\d]{4}-[a-zA-Z\d]{4}-[a-zA-Z\d]{4}-[a-zA-Z\d]{4}$/;

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const agent = useAgent();

  const login = useMutation({
    mutationKey: ["login"],
    mutationFn: async () => {
      const res = await agent.login({
        identifier: identifier.startsWith("@")
          ? identifier.slice(1)
          : identifier,
        password,
      });
      if (!res.success) {
        Alert.alert(
          "Could not log you in",
          "Please check your details and try again",
        );
      }
    },
  });

  const theme = useTheme();

  return (
    <View
      className={cx("flex-1 px-4 pt-6", theme.dark ? "bg-black" : "bg-white")}
    >
      {Platform.OS !== "ios" && (
        <StatusBar style={theme.dark ? "light" : "dark"} />
      )}
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
            placeholderTextColor={theme.dark ? "rgb(163, 163, 163)" : undefined}
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
            className="ml-2 flex-1 overflow-visible py-3 text-base leading-5"
            placeholder="App Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={theme.dark ? "rgb(163,163,163)" : undefined}
          />
        </View>
        {password && !appPwdRegex.test(password) && (
          <Animated.View
            entering={FadeIn}
            exiting={FadeOut}
            className="flex-row rounded border-yellow-500 bg-yellow-50 p-3 dark:bg-yellow-950"
            style={{
              borderWidth: StyleSheet.hairlineWidth,
            }}
          >
            <AlertTriangleIcon
              size={18}
              className="mt-0.5 text-yellow-800 dark:text-white"
            />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium leading-5 text-yellow-800 dark:text-white">
                Warning: Not an App Password
              </Text>
              <Text className="my-1" style={{ color: theme.colors.text }}>
                You may want to consider using an App Password rather than your
                main password. You can create one by going to Settings {">"} App
                Passwords in the official app.
              </Text>
            </View>
          </Animated.View>
        )}
        <Animated.View
          className="flex-row items-center justify-between pt-1"
          layout={Layout}
        >
          <TextButton
            onPress={() =>
              Alert.alert(
                "Help",
                "Log in using your Bluesky account details. If you don't already have an account, you'll need to create one at https://bsky.app - you'll need an invite code.",
              )
            }
            title="Help"
          />
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
