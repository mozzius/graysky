import { useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Lock, User } from "lucide-react-native";

import { useAgent } from "../../lib/agent";

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

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <Stack.Screen options={{ title: "Log in", headerBackTitle: "Back" }} />
      <View className="items-stretch gap-4">
        <View className="flex flex-row items-center rounded border border-neutral-300 bg-neutral-50 pl-3">
          <User size={18} color="rgb(163 163 163)" />
          <TextInput
            className="ml-2 flex-1 overflow-visible py-3 text-base leading-5"
            placeholder="Username or email address"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
          />
        </View>
        <View className="flex flex-row items-center rounded border border-neutral-300 bg-neutral-50 pl-3">
          <Lock size={18} color="rgb(163 163 163)" />
          <TextInput
            className="ml-2 flex-1 overflow-visible py-3 text-base leading-5"
            placeholder="App Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
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
    </SafeAreaView>
  );
}
