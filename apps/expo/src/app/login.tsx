import { useState } from "react";
import { Button, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import {
  BskyAgent,
  type AtpSessionData,
  type AtpSessionEvent,
} from "@atproto/api";
import { useMutation } from "@tanstack/react-query";

const agent = new BskyAgent({
  service: "https://bsky.app",
  // persistSession(evt: AtpSessionEvent, sess?: AtpSessionData) {
  //   // store the session-data for reuse
  //   console.log({
  //     evt,
  //     sess,
  //   });
  // },
});

export default function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const login = useMutation({
    mutationKey: ["login"],
    mutationFn: async () => {
      try {
        console.log({ identifier, password });
        await agent.login({ identifier, password });
      } catch (err) {
        console.error("caught error");
        console.error((err as Error).stack);
      }
    },
  });

  return (
    <SafeAreaView className="flex-1 px-4">
      <Stack.Screen options={{ title: "Log in" }} />
      <View className="flex gap-4">
        <TextInput
          className="rounded bg-white p-2 text-base"
          placeholder="Username or email address"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
        />
        <TextInput
          className="rounded bg-white p-2 text-base"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        {identifier && password && (
          <View>
            <Button
              disabled={login.isLoading}
              onPress={() => login.mutate()}
              title="Log in"
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
