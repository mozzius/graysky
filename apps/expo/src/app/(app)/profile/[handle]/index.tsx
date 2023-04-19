import { ActivityIndicator, ScrollView, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { ProfileInfo } from "../../../../components/profile-info";
import { useAuthedAgent } from "../../../../lib/agent";

export default function ProfilePage() {
  const { handle } = useLocalSearchParams() as { handle: string };
  const agent = useAuthedAgent();

  const profile = useQuery(["profile", handle], async () => {
    const profile = await agent.getProfile({
      actor: handle,
    });
    return profile.data;
  });

  return (
    <ScrollView>
      <Stack.Screen
        options={{
          headerTransparent: true,
          headerTitle: "",
          headerBackTitle: "",
          headerStyle: {
            backgroundColor: "transparent",
          },
        }}
      />
      {profile.data ? (
        <ProfileInfo profile={profile.data} />
      ) : (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      )}
    </ScrollView>
  );
}
