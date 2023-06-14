import { useMemo } from "react";
import { Text, View } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";

import { ItemSeparator } from "../../components/item-separator";
import { PersonRow } from "../../components/lists/person-row";
import { QueryWithoutData } from "../../components/query-without-data";
import { useAuthedAgent } from "../../lib/agent";

export default function MutedUsers() {
  const agent = useAuthedAgent();
  const theme = useTheme();

  const mutes = useInfiniteQuery({
    queryKey: ["mutes"],
    queryFn: async ({ pageParam }) => {
      const mutes = await agent.app.bsky.graph.getMutes({
        cursor: pageParam as string | undefined,
      });
      if (!mutes.success) throw new Error("Could not fetch mutes");
      return mutes.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const data = useMemo(() => {
    if (!mutes.data) return [];
    return mutes.data.pages.flatMap((x) => x.mutes);
  }, [mutes.data]);

  if (mutes.data) {
    return (
      <FlashList<AppBskyActorDefs.ProfileView>
        data={data}
        renderItem={({ item }) => <PersonRow person={item} />}
        estimatedItemSize={61}
        ItemSeparatorComponent={() => (
          <ItemSeparator iconWidth="w-10" containerClassName="pr-4" />
        )}
        ListEmptyComponent={() => (
          <View className="py-8">
            <Text
              className="text-center text-base"
              style={{ color: theme.colors.text }}
            >
              You haven't muted anyone
            </Text>
          </View>
        )}
      />
    );
  }

  return <QueryWithoutData query={mutes} />;
}
