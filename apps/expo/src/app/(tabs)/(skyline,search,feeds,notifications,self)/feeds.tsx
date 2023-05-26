import {
  Alert,
  ScrollView,
  SectionList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Link, Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react-native";

import { Avatar } from "../../../components/avatar";
import { useDrawer } from "../../../components/drawer-content";
import { GeneratorRow } from "../../../components/generator-row";
import { QueryWithoutData } from "../../../components/query-without-data";
import { useAuthedAgent } from "../../../lib/agent";
import { useSavedFeeds } from "../../../lib/hooks";

const FeedsPage = () => {
  const agent = useAuthedAgent();
  const savedFeeds = useSavedFeeds();
  const recommended = useQuery({
    queryKey: ["feeds", "recommended"],
    queryFn: async () => {
      const popular = await agent.app.bsky.unspecced.getPopularFeedGenerators();
      if (!popular.success) throw new Error("Failed to fetch popular feeds");
      return popular.data.feeds;
    },
  });

  if (!savedFeeds.data) return <QueryWithoutData query={savedFeeds} />;

  if (recommended.data) {
    return (
      <ScrollView>
        <View className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-bold dark:text-neutral-50">
              Saved Feeds
            </Text>
            <Link href="/algorithms" asChild>
              <TouchableOpacity>
                <Text className="text-base font-bold dark:text-neutral-50">
                  Edit
                </Text>
              </TouchableOpacity>
            </Link>
          </View>
          <View className="mt-4 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700 ">
            {savedFeeds.data.feeds.map((feed, i, arr) => {
              const isLast = i === arr.length - 1;
              const href = `/profile/${feed.creator.did}/generator/${feed.uri
                .split("/")
                .pop()}`;
              return (
                <Link href={href} asChild key={feed.uri}>
                  <TouchableOpacity>
                    <GeneratorRow
                      icon="chevron"
                      border={!isLast}
                      image={feed.avatar}
                    >
                      <Text className="text-base dark:text-neutral-50">
                        {feed.displayName}
                      </Text>
                      <Text className="text-neutral-400">
                        By @{feed.creator.handle}
                      </Text>
                    </GeneratorRow>
                  </TouchableOpacity>
                </Link>
              );
            })}
          </View>
        </View>
      </ScrollView>
    );
  }

  return <QueryWithoutData query={recommended} />;
};

export default function Page() {
  const openDrawer = useDrawer();

  return (
    <>
      <Stack.Screen
        options={{
          title: "Feeds",
          headerLeft: () => (
            <TouchableOpacity onPress={openDrawer}>
              <Avatar size="small" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => Alert.alert("TODO: add feed by URL")}
            >
              <Plus size={24} className="text-black dark:text-white" />
            </TouchableOpacity>
          ),
        }}
      />
      <View className="flex-1 border-neutral-800 dark:border-t">
        <FeedsPage />
      </View>
    </>
  );
}
