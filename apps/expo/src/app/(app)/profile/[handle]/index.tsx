import { Image, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../../../../lib/agent";

export default function ProfilePage() {
  const { handle } = useSearchParams() as { handle: string };
  const agent = useAuthedAgent();

  const profile = useQuery(["profile", handle], async () => {
    const profile = await agent.getProfile({
      actor: handle,
    });
    return profile.data;
  });

  if (!profile.data) return null;

  return (
    <ScrollView>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: "",
          headerStyle: {
            backgroundColor: "transparent",
          },
        }}
      />
      <Image
        source={{ uri: profile.data.banner }}
        className="h-48 w-full"
        alt="banner image"
      />
      <Text>{JSON.stringify(profile.data, null, 2)}</Text>
    </ScrollView>
  );
}
