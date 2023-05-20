import { useAgent } from "../lib/agent";
import { useMutation } from "@tanstack/react-query";
import { Lock, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
            ]
          )
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

  const { colorScheme } = useColorScheme();

  return (
    <SafeAreaView className="flex-1 bg-white px-4 dark:bg-black">
      <View className="items-stretch gap-4">
        <View className="flex flex-row items-center rounded border border-neutral-300 bg-neutral-50 pl-3 dark:border-neutral-600 dark:bg-black">
          <User size={18} color="rgb(163 163 163)" />
          <TextInput
            className="ml-2 flex-1 overflow-visible py-3 text-base leading-5 dark:text-white dark:placeholder-neutral-400"
            placeholder="Username or email address"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
            placeholderTextColor={
              colorScheme === "dark" ? "rgb(62,62,62)" : undefined
            }
          />
        </View>
        <View className="flex flex-row items-center rounded border border-neutral-300 bg-neutral-50 pl-3 dark:border-neutral-600 dark:bg-black">
          <Lock size={18} color="rgb(163 163 163)" />
          <TextInput
            className="ml-2 flex-1 overflow-visible py-3 text-base leading-5 dark:text-white dark:placeholder-neutral-400"
            placeholder="App Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={
              colorScheme === "dark" ? "rgb(62,62,62)" : undefined
            }
          />
        </View>
        <View className="flex-row justify-between">
          <Button
            onPress={() =>
              Alert.alert(
                "App Passwords",
                "You should use an app password instead of your main password. You can create one by going to Settings > App Passwords."
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
