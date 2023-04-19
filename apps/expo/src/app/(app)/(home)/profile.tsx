import { ActivityIndicator, ScrollView, View } from "react-native";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";

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

  const profilePosts = useInfiniteQuery({
    queryKey: ["profile", agent.session.handle, "posts"],
    queryFn: async ({ pageParam }) => {
      const timeline = await agent.getAuthorFeed({
        actor: agent.session.handle,
        cursor: pageParam as string | undefined,
      });
      return timeline.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
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
