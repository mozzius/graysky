import { useState } from "react";
import { Alert, Button, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { Lock, User } from "lucide-react-native";

import { useAgent } from "../../lib/agent";

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const agent = useAgent();

  const login = useMutation({
    mutationKey: ["login"],
    mutationFn: async () => {
      await agent.login({ identifier, password });
    },
  });

  return (
    <SafeAreaView className="flex-1 bg-white px-4">
      <Stack.Screen options={{ title: "Log in", headerBackTitle: "Back" }} />
      <View className="items-stretch gap-4">
        <View className="flex flex-row items-center rounded border border-neutral-300 px-3 py-2">
          <User size={18} color="rgb(163 163 163)" />
          <TextInput
            className="mb-1 ml-2 flex-1 text-base"
            placeholder="Username or email address"
            value={identifier}
            onChangeText={setIdentifier}
            autoCapitalize="none"
          />
        </View>
        <View className="flex flex-row items-center rounded border border-neutral-300 px-3 py-2">
          <Lock size={18} color="rgb(163 163 163)" />
          <TextInput
            className="mb-1 ml-2 flex-1 text-base"
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
        <View className="flex-row justify-between">
          <Button
            onPress={() =>
              Alert.alert(
                "Help",
                "You need a bsky.social account in order to log in. If you don't have one, you'll need an invite code.",
              )
            }
            title="Help"
          />
          <View />
          {identifier && password && (
            <Button
              disabled={login.isLoading}
              onPress={() => login.mutate()}
              title="Log in"
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
