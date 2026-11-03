import { Fragment, useCallback, useState } from "react";
import { Platform, ScrollView, TouchableOpacity, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { CheckIcon } from "lucide-react-native";

import { FeedRow } from "~/components/feed-row";
import { ItemSeparator } from "~/components/item-separator";
import { QueryWithoutData } from "~/components/query-without-data";
import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { getPopularFeedGenerators } from "~/lib/unspecced";
import { cx } from "~/lib/utils/cx";
import { isType } from "~/lib/utils/types";
import { isIOS26 } from "~/lib/utils/version";

// TODO: make this a flashlist and add a cursor to the query

export default function DiscoveryPage() {
  const { _ } = useLingui();
  const agent = useAgent();
  const theme = useTheme();
  const [search, setSearch] = useState("");
  const router = useRouter();
  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: _(msg`Search feeds`),
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    hideWhenScrolling: false,
    hideNavigationBar: false,
  });

  const saved = useQuery({
    queryKey: ["feeds", "saved", "plain"],
    queryFn: async () => {
      const prefs = await agent.call(app.bsky.actor.getPreferences);
      const feeds = prefs.preferences.find((pref) =>
        isType(app.bsky.actor.defs.savedFeedsPref, pref),
      ) as app.bsky.actor.defs.SavedFeedsPref | undefined;
      return feeds?.saved ?? [];
    },
  });

  const recommended = useQuery({
    queryKey: ["feeds", "discover", search],
    queryFn: async () => {
      const popular = await agent.call(getPopularFeedGenerators, {
        query: search || undefined,
      });
      return popular.feeds;
    },
    placeholderData: keepPreviousData,
  });

  const headerRight = useCallback(
    () =>
      Platform.select({
        ios: (
          <TouchableOpacity onPress={() => router.push("../")}>
            <Text primary className="text-lg font-medium">
              <Trans>Done</Trans>
            </Text>
          </TouchableOpacity>
        ),
        default: null,
      }),
    [router],
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
          className={cx(
            "overflow-hidden rounded-lg",
            Platform.select({
              ios: "my-1",
              android: "my-4",
            }),
          )}
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
      <Stack.Screen
        options={{
          headerSearchBarOptions,
          ...(!isIOS26
            ? { headerRight }
            : {
                unstable_headerRightItems: () => [
                  {
                    type: "button",
                    onPress: () => router.dismiss(),
                    label: _(msg`Close`),
                    icon: { type: "sfSymbol", name: "xmark" },
                  },
                ],
              }),
        }}
      />
      <StatusBar modal />
      <QueryWithoutData query={recommended} />
    </>
  );
}
