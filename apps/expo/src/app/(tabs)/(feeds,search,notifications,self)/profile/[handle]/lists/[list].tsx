import * as Tabs from "react-native-collapsible-tab-view";
import { Stack, useLocalSearchParams } from "expo-router";
import { AppBskyGraphDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useInfiniteQuery } from "@tanstack/react-query";

import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/text";
import { useAgent } from "~/lib/agent";
import { createTopTabsScreenOptions } from "~/lib/utils/top-tabs";

export default function ListsScreen() {
  const { handle, list: cid } = useLocalSearchParams<{
    handle: string;
    list: string;
  }>();
  const agent = useAgent();
  const theme = useTheme();

  const list = useInfiniteQuery({
    queryKey: ["profile", handle, "lists", cid],
    queryFn: async ({ pageParam }) => {
      const uri = `at://${handle}/app.bsky.graph.list/${cid}`;
      const res = await agent.app.bsky.graph.getList({
        list: uri,
        cursor: pageParam as string | undefined,
      });
      if (!res.success) throw new Error("Could not fetch list");
      return res.data;
    },
  });

  if (list.data) {
    const info = list.data.pages[0]?.list;
    if (!info) return null;
    return (
      <>
        <Stack.Screen
          options={{
            title: "List",
          }}
        />
        {info.purpose === AppBskyGraphDefs.CURATELIST ? (
          <Tabs.Container
            headerContainerStyle={{ shadowOpacity: 0, elevation: 0 }}
            renderTabBar={(props) => (
              <Tabs.MaterialTabBar
                {...props}
                {...createTopTabsScreenOptions(theme)}
              />
            )}
            lazy
          >
            <Tabs.Tab name="feed">
              <Text>Feed</Text>
            </Tabs.Tab>
            <Tabs.Tab name="members">
              <Text>Members</Text>
            </Tabs.Tab>
          </Tabs.Container>
        ) : (
          <Tabs.Container
            headerContainerStyle={{ shadowOpacity: 0, elevation: 0 }}
            renderTabBar={(props) => (
              <Tabs.MaterialTabBar
                {...props}
                {...createTopTabsScreenOptions(theme)}
              />
            )}
            lazy
          >
            <Tabs.Tab name="members">
              <Text>Members</Text>
            </Tabs.Tab>
          </Tabs.Container>
        )}
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "List",
        }}
      />
      <QueryWithoutData query={list} />
    </>
  );
}
