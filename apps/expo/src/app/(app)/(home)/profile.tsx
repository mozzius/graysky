import { ActivityIndicator, ScrollView, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { ProfileInfo } from "../../../components/profile-info";
import { useAuthedAgent } from "../../../lib/agent";

export default function ProfilePage() {
  const agent = useAuthedAgent();

  const profile = useQuery(["profile", agent.session.handle], async () => {
    const profile = await agent.getProfile({
      actor: agent.session.handle,
    });
    return profile.data;
  });

  return (
    <ScrollView>
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
