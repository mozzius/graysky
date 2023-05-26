import { Text } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";

import { GeneratorRow } from "../components/generator-row";
import { QueryWithoutData } from "../components/query-without-data";
import { useAuthedAgent } from "../lib/agent";
import { useBookmarks } from "../lib/hooks";

export default function AlgorithmsModal() {
  const agent = useAuthedAgent();
  const algos = useQuery({
    queryKey: ["algorithms"],
    queryFn: async () => {
      const algos = await agent.app.bsky.unspecced.getPopularFeedGenerators();
      if (!algos.success) throw new Error("Failed to fetch algorithms");
      return algos.data;
    },
  });

  const bookmarks = useBookmarks();

  // most important, so block first
  if (!bookmarks.data) {
    return <QueryWithoutData query={bookmarks} />;
  }

  if (algos.data) {
    return (
      <FlashList
        estimatedItemSize={72}
        data={algos.data.feeds}
        extraData={bookmarks.data}
        renderItem={({ item }) => {
          const bookmarked =
            bookmarks.data.findIndex((x) => x.uri === item.uri) >= 0;
          return (
            <GeneratorRow
              image={item.avatar}
              bookmarked={bookmarked}
              toggleBookmark={() => {
                const newBookmarks = bookmarked
                  ? bookmarks.data.filter((x) => x.uri !== item.uri)
                  : [...bookmarks.data, item];
                AsyncStorage.setItem(
                  "bookmarks",
                  JSON.stringify(newBookmarks),
                  () => bookmarks.refetch(),
                );
              }}
            >
              <Text className="text-base dark:text-neutral-50">
                {item.displayName}
              </Text>
              <Text className="text-neutral-400">
                By @{item.creator.handle}
              </Text>
            </GeneratorRow>
          );
        }}
      />
    );
  }

  return <QueryWithoutData query={algos} />;
}
