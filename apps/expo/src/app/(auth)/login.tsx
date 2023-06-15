import { useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { Lock, User } from "lucide-react-native";

import { useAgent } from "../../lib/agent";
import { useColorScheme } from "../../lib/utils/color-scheme";

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
      className="flex-1 p-4"
      style={{ backgroundColor: theme.dark ? "black" : "white" }}
    >
      <View className="items-stretch gap-4">
        <View className="flex flex-row items-center rounded border border-neutral-300 pl-3 dark:border-neutral-600">
          <User size={18} color="rgb(163 163 163)" />
          <TextInput
            style={{ color: theme.colors.text }}
            className="ml-2 flex-1 overflow-visible py-3 text-base leading-5"
            placeholder="Username or email address"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            placeholderTextColor={theme.dark ? "rgb(163,163,163)" : undefined}
            onBlur={() => {
              let fixed = identifier;
              if (identifier.startsWith("@")) fixed = identifier.slice(1);
              if (!identifier.includes(".")) fixed = `${fixed}.bsky.social`;
              setIdentifier(fixed);
            }}
          />
        </View>
        <View className="flex flex-row items-center rounded border border-neutral-300 pl-3 dark:border-neutral-600">
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
        <View className="flex-row justify-between">
          <Button
            onPress={() =>
              Alert.alert(
                "App Passwords",
                "You should use an app password instead of your main password. You can create one by going to Settings > App Passwords.",
              )
            }
            title="Help"
          />
          <View />

          <Button
            disabled={login.isLoading || !identifier || !password}
            onPress={() => login.mutate()}
            title="Log in"
          />
        </View>
      </View>
    </View>
  );
}
