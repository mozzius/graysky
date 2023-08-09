import { Fragment, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import fuzzySort from "fuzzysort";
import { CheckIcon } from "lucide-react-native";

import { FeedRow } from "../../../../components/feed-row";
import { ItemSeparator } from "../../../../components/item-separator";
import { QueryWithoutData } from "../../../../components/query-without-data";
import { useAgent } from "../../../../lib/agent";

export default function DiscoveryPage() {
  const agent = useAgent();
  const theme = useTheme();
  const [search, setSearch] = useState("");

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
    queryKey: ["feeds", "discover"],
    queryFn: async () => {
      const popular = await agent.app.bsky.unspecced.getPopularFeedGenerators();
      if (!popular.success) throw new Error("Failed to fetch popular feeds");
      return popular.data.feeds;
    },
  });

  const sorted = useMemo(() => {
    if (!recommended.data) return [];

    if (!search) return recommended.data;

    const results = fuzzySort.go(search, recommended.data, {
      key: "displayName",
    });

    return results.map((result) => result.obj);
  }, [recommended.data, search]);

  if (recommended.data) {
    return (
      <ScrollView
        className="flex-1 px-4"
        contentInsetAdjustmentBehavior="automatic"
      >
        <StatusBar style="light" />
        <Stack.Screen
          options={{
            headerSearchBarOptions: {
              placeholder: "Search feeds",
              onChangeText: (evt) => setSearch(evt.nativeEvent.text),
            },
          }}
        />
        <View
          style={{ backgroundColor: theme.colors.card }}
          className="my-4 overflow-hidden rounded-lg"
        >
          {sorted.map((feed, i, arr) => (
            <Fragment key={feed.uri}>
              <FeedRow feed={feed} large>
                {saved.data?.some((f) => f === feed.uri) && (
                  <CheckIcon
                    className="ml-2"
                    size={20}
                    color={theme.colors.primary}
                  />
                )}
              </FeedRow>
              {i !== arr.length - 1 && <ItemSeparator iconWidth="w-10" />}
            </Fragment>
          ))}
        </View>
      </ScrollView>
    );
  }

  return <QueryWithoutData query={recommended} />;
}
