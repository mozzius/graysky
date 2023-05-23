import { Text, View } from "react-native";
import { Image } from "expo-image";
import { TouchableOpacity } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { ErrorBoundary } from "react-error-boundary";

import { useAgent } from "../lib/agent";
import { useLists } from "./lists/context";

export const ActorDetails = () => (
  <ErrorBoundary fallback={<></>}>
    <ActorDetailsInner />
  </ErrorBoundary>
);

const ActorDetailsInner = () => {
  const agent = useAgent();
  const { openFollows, openFollowers } = useLists();

  const { data: self } = useQuery({
    queryKey: ["profile", agent.session?.did],
    queryFn: async () => {
      if (!agent.session) return null;
      const profile = await agent.getProfile({
        actor: agent.session.did,
      });
      if (!profile.success) throw new Error("Couldn't fetch profile");
      return profile.data;
    },
  });
  if (!self) return null;
  return (
    <View>
      <Image
        source={{ uri: self.avatar }}
        alt={self.displayName}
        className="h-16 w-16 rounded-full bg-neutral-200 object-cover dark:bg-neutral-800"
      />
      <View className="mt-2 flex">
        <Text className="text-2xl font-semibold dark:text-white">
          {self.displayName}
        </Text>
        <Text className="mt-px text-base text-neutral-500 dark:text-neutral-400">{`@${self.handle}`}</Text>
      </View>
      <View className="mt-3 flex-row flex-wrap">
        <TouchableOpacity onPress={() => openFollowers(self.did)}>
          <Text className="mr-4 dark:text-white">
            <Text className="font-bold">{self.followersCount}</Text> Followers
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openFollows(self.did)}>
          <Text className="dark:text-white">
            <Text className="font-bold">{self.followsCount}</Text> Following
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
