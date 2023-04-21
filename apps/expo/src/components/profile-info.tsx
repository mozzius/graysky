import { Button, Image, Text, View } from "react-native";
import type { ProfileViewDetailed } from "@atproto/api/dist/client/types/app/bsky/actor/defs";
import { useMutation } from "@tanstack/react-query";

import { useAuthedAgent } from "../lib/agent";
import { queryClient } from "../lib/query-client";

interface Props {
  profile: ProfileViewDetailed;
}

export const ProfileInfo = ({ profile }: Props) => {
  const agent = useAuthedAgent();

  const toggleFollow = useMutation({
    mutationKey: ["follow", profile.did],
    mutationFn: async () => {
      if (profile.viewer?.following) {
        await agent.deleteFollow(profile.viewer?.following);
      } else {
        await agent.follow(profile.did);
      }
    },
    onSettled: () =>
      void queryClient.invalidateQueries(["profile", profile.handle]),
  });

  return (
    <View>
      <Image
        source={{ uri: profile.banner }}
        className="h-32 w-full"
        alt="banner image"
      />
      <View className="relative border-b border-b-neutral-200 bg-white px-4 pb-4">
        <View className="h-10 flex-row items-center justify-end">
          <View className="absolute -top-11 left-0 rounded-full border-4 border-white">
            <Image
              source={{ uri: profile.avatar }}
              className="h-20 w-20 rounded-full"
              alt="avatar image"
            />
          </View>
          {agent.session?.handle !== profile.handle && (
            <Button
              disabled={toggleFollow.isLoading}
              onPress={() => toggleFollow.mutate()}
              title={profile.viewer?.following ? "Following" : "Follow"}
            />
          )}
        </View>
        <Text className="mt-1 text-2xl font-medium">{profile.displayName}</Text>
        <Text className="text-neutral-500">@{profile.handle}</Text>
        <View className="mt-3 flex-row">
          <Text>
            <Text className="font-bold">{profile.followersCount}</Text>{" "}
            Followers
          </Text>
          <Text className="ml-4">
            <Text className="font-bold">{profile.followsCount}</Text> Following
          </Text>
        </View>
        {profile.description && (
          <Text className="mt-3">{profile.description}</Text>
        )}
      </View>
    </View>
  );
};
