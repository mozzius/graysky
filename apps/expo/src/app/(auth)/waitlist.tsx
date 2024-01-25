import { useState } from "react";
import { ActivityIndicator, Alert, ScrollView, View } from "react-native";
import { showToastable } from "react-native-toastable";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { TextButton } from "~/components/text-button";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useLinkPress } from "~/lib/hooks/link-press";

const schema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(false), error: z.string() }),
  z.object({ success: z.literal(true) }),
]);

export default function Waitlist() {
  const [email, setEmail] = useState("");
  const theme = useTheme();
  const router = useRouter();
  const { openLink } = useLinkPress();

  const submit = useMutation({
    mutationKey: ["waitlist"],
    mutationFn: async () => {
      const res = await fetch("https://bsky.app/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const resBody = schema.parse(await res.json());
      if (!resBody.success) {
        throw new Error(
          resBody.error ||
            "Something went wrong. Check your email and try again.",
        );
      }
    },
    onError: (err) =>
      showToastable({
        title: "Error adding to waitlist",
        message: err instanceof Error ? err.message : "Unknown error",
        status: "warning",
      }),
    onSuccess: () =>
      Alert.alert("Success", "You've been added to the waitlist!", [
        { text: "OK", onPress: () => router.push("/") },
      ]),
  });

  return (
    <TransparentHeaderUntilScrolled>
      <ScrollView
        className="flex-1 px-4"
        contentInsetAdjustmentBehavior="automatic"
      >
        <View className="mt-4 flex-1">
          <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
            Email address
          </Text>
          <View
            style={{ backgroundColor: theme.colors.card }}
            className="flex-1 overflow-hidden rounded-lg"
          >
            <TextInput
              value={email}
              placeholder="alice@example.com"
              autoComplete="email"
              autoCapitalize="none"
              onChange={(evt) => setEmail(evt.nativeEvent.text)}
              className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
              autoFocus
            />
          </View>
        </View>
        <Text className="mx-4 mt-3 text-sm text-neutral-500">
          Bluesky uses invites to build a healthier community. If you don{"'"}t
          know anybody with an invite, you can sign up for the waitlist to be
          notified when it{"'"}s your turn to sign up.
        </Text>
        <Text className="mx-4 mt-2 text-sm text-neutral-500">
          If you{"'"}re a developer interested in building on the AT Protocol,
          you might be able to skip the queue via the{" "}
          <Text
            primary
            accessibilityRole="link"
            onPress={() =>
              openLink("https://atproto.com/blog/call-for-developers")
            }
          >
            developer waitlist form
          </Text>
          .
        </Text>
        <View className="mt-6 flex-row items-center justify-center">
          {submit.isPending ? (
            <ActivityIndicator />
          ) : (
            <TextButton
              disabled={!z.string().email().safeParse(email).success}
              onPress={() => submit.mutate()}
              title="Join waitlist"
              className="font-medium"
            />
          )}
        </View>
      </ScrollView>
    </TransparentHeaderUntilScrolled>
  );
}
