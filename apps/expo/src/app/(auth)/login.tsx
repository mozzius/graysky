import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { Lock, User } from "lucide-react-native";

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
      if (!appPwdRegex.test(password)) {
        await new Promise((resolve, reject) =>
          Alert.alert(
            "Warning: Not an App Password",
            "We recommend you use an App Password rather than your main password. You can create one by going to Settings > App Passwords.",
            [
              {
                text: "Cancel",
                onPress: reject,
                style: "cancel",
              },
              {
                text: "Continue",
                onPress: resolve,
              },
            ],
          ),
        );
      }
      await agent.login({
        identifier: identifier.startsWith("@")
          ? identifier.slice(1)
          : identifier,
        password,
      });
    },
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
          <User size={18} color="rgb(163 163 163)" />
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
              if (!identifier.includes(".")) fixed = `${fixed}.bsky.social`;
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
          <Lock size={18} color="rgb(163 163 163)" />
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
        <View className="flex-row items-center justify-between pt-1">
          <TextButton
            onPress={() =>
              Alert.alert(
                "App Passwords",
                "You should use an app password instead of your main password. You can create one by going to Settings > App Passwords.",
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
        </View>
      </View>
    </View>
  );
}
