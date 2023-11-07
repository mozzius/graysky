import { Fragment, useCallback, useState } from "react";
import { Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react-native";

import { FeedRow } from "~/components/feed-row";
import { ItemSeparator } from "~/components/item-separator";
import { QueryWithoutData } from "~/components/query-without-data";
import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/text";
import { useAgent } from "~/lib/agent";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";

// TODO: make this a flashlist and add a cursor to the query

export default function DiscoveryPage() {
  const agent = useAgent();
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: "Search feeds",
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    hideWhenScrolling: false,
    hideNavigationBar: false,
  });

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
    queryKey: ["feeds", "discover", search],
    queryFn: async () => {
      const popular = await agent.app.bsky.unspecced.getPopularFeedGenerators({
        query: search || undefined,
      });
      if (!popular.success) throw new Error("Failed to fetch popular feeds");
      return popular.data.feeds;
    },
    keepPreviousData: true,
  });

  const headerRight = useCallback(
    () =>
      Platform.select({
        ios: (
          <TouchableOpacity
            onPress={() => {
              router.canGoBack() ? router.push("../") : router.push("/feeds");
            }}
          >
            <Text
              style={{ color: theme.colors.primary }}
              className="text-lg font-medium"
            >
              Done
            </Text>
          </TouchableOpacity>
        ),
        default: null,
      }),
    [router, theme.colors.primary],
  );

  if (recommended.data) {
    return (
      <ScrollView
        className="flex-1 px-4"
        contentInsetAdjustmentBehavior="automatic"
      >
        <StatusBar modal />
        <Stack.Screen options={{ headerSearchBarOptions, headerRight }} />
        <View
          style={{ backgroundColor: theme.colors.card }}
          className="my-4 overflow-hidden rounded-lg"
        >
          {recommended.data.map((feed, i, arr) => (
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

  return (
    <>
      <Stack.Screen options={{ headerSearchBarOptions, headerRight }} />
      <QueryWithoutData query={recommended} />
    </>
  );
}
