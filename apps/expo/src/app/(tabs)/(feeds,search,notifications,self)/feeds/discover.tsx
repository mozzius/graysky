import { Fragment } from "react";
import { ScrollView, View } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Check } from "lucide-react-native";

import { FeedRow } from "../../../../components/feed-row";
import { ItemSeparator } from "../../../../components/item-separator";
import { QueryWithoutData } from "../../../../components/query-without-data";
import { useAuthedAgent } from "../../../../lib/agent";

export default function DiscoveryPage() {
  const agent = useAuthedAgent();
  const theme = useTheme();

  const saved = useQuery({
    queryKey: ["feeds", "saved", "plain"],
    queryFn: async () => {
      const prefs = await agent.app.bsky.actor.getPreferences();
      if (!prefs.success) throw new Error("Could not fetch feeds");
      const feeds = prefs.data.preferences.find(
        (pref) =>
          AppBskyActorDefs.isSavedFeedsPref(pref) &&
          AppBskyActorDefs.validateSavedFeedsPref(pref).success,
      ) as AppBskyActorDefs.SavedFeedsPref | undefined;
      return feeds?.saved;
    },
  });

  const recommended = useQuery({
    queryKey: ["feeds", "recommended"],
    queryFn: async () => {
      const popular = await agent.app.bsky.unspecced.getPopularFeedGenerators();
      if (!popular.success) throw new Error("Failed to fetch popular feeds");
      return popular.data.feeds;
    },
  });

  if (recommended.data) {
    return (
      <ScrollView className="flex-1 px-6">
        <View
          style={{ backgroundColor: theme.colors.card }}
          className="my-8 overflow-hidden rounded-lg"
        >
          {recommended.data.map((feed, i, arr) => (
            <Fragment key={feed.uri}>
              <FeedRow feed={feed}>
                {saved.data?.some((f) => f === feed.uri) && (
                  <Check
                    className="ml-2"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </FeedRow>
              {i !== arr.length - 1 && <ItemSeparator iconWidth="w-6" />}
            </Fragment>
          ))}
        </View>
      </ScrollView>
    );
  }

  return <QueryWithoutData query={recommended} />;
}
