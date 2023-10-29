import { useCallback } from "react";
import {
  Alert,
  Platform,
  Share,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import * as Tabs from "react-native-collapsible-tab-view";
import { showToastable } from "react-native-toastable";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AppBskyGraphDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react-native";

import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/text";
import { useAgent } from "~/lib/agent";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { cx } from "~/lib/utils/cx";
import { createTopTabsScreenOptions } from "~/lib/utils/top-tabs";

export default function ListsScreen() {
  const { handle, list: rkey } = useLocalSearchParams<{
    handle: string;
    list: string;
  }>();
  const theme = useTheme();

  const uri = `at://${handle}/app.bsky.graph.list/${rkey}`;

  const list = useListQuery(uri);

  const info = list.data?.pages[0]?.list;

  const renderHeader = useCallback(() => {
    if (!info) return null;
    return <ListHeader info={info} handle={handle} rkey={rkey} />;
  }, [info, handle, rkey]);

  if (list.data) {
    if (!info) return null;
    if (info.purpose === AppBskyGraphDefs.CURATELIST) {
      return (
        <Tabs.Container
          renderHeader={renderHeader}
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
            <ListMembers query={list} />
          </Tabs.Tab>
        </Tabs.Container>
      );
    } else {
      return (
        <Tabs.Container
          renderHeader={renderHeader}
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
            <ListMembers query={list} />
          </Tabs.Tab>
        </Tabs.Container>
      );
    }
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "List",
          headerTitle: "",
        }}
      />
      <QueryWithoutData query={list} />
    </>
  );
}

const useListQuery = (uri: string) => {
  const agent = useAgent();
  return useInfiniteQuery({
    queryKey: ["list", uri],
    queryFn: async ({ pageParam }) => {
      const res = await agent.app.bsky.graph.getList({
        list: uri,
        cursor: pageParam as string | undefined,
      });
      if (!res.success) throw new Error("Could not fetch list");
      return res.data;
    },
  });
};

const ListHeader = ({
  info,
  handle,
  rkey,
}: {
  info: AppBskyGraphDefs.ListView;
  handle?: string;
  rkey?: string;
}) => {
  const router = useRouter();
  const agent = useAgent();
  const { showActionSheetWithOptions } = useActionSheet();
  const theme = useTheme();

  const deleteList = useMutation({
    mutationFn: async () => {
      if (!handle || !rkey) throw new Error("Missing route params");
      await agent.com.atproto.repo.applyWrites({
        repo: handle,
        writes: [
          {
            $type: "com.atproto.repo.applyWrites#delete",
            collection: "app.bsky.graph.list",
            rkey: rkey,
          },
        ],
      });
    },
    onSuccess: () => {
      router.back();
      showToastable({
        title: "List deleted",
        message: "Your list has been deleted",
      });
    },
    onError: () => {
      showToastable({
        title: "Error",
        message: "Could not delete list",
      });
    },
  });

  let listType = null;
  switch (info.purpose) {
    case AppBskyGraphDefs.CURATELIST:
      listType = "Curation list";
      break;
    case AppBskyGraphDefs.MODLIST:
      listType = "Moderation list";
      break;
  }
  return (
    <View className="flex-1 px-4 pb-2 pt-4">
      <Stack.Screen
        options={{
          title: info?.name ?? "List",
          headerTitle: "",
          headerRight: () => (
            <View className="flex-row">
              <TouchableOpacity
                className="mr-1 rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700"
                onPress={() => {
                  if (!info) return;
                  if (info.creator.did === agent.session?.did) {
                    showActionSheetWithOptions(
                      {
                        options: ["Edit", "Delete", "Share", "Cancel"],
                        destructiveButtonIndex: 1,
                        cancelButtonIndex: 3,
                        ...actionSheetStyles(theme),
                      },
                      (buttonIndex) => {
                        const bskyUrl = `https://bsky.app/${handle}/lists/${rkey}`;
                        switch (buttonIndex) {
                          case 0:
                            Alert.alert(
                              "Not yet implemented",
                              "Please use the official app",
                            );
                            break;
                          case 1:
                            Alert.alert(
                              "Delete list",
                              "Are you sure you want to delete this list?",
                              [
                                {
                                  text: "Cancel",
                                  style: "cancel",
                                },
                                {
                                  text: "Delete",
                                  style: "destructive",
                                  onPress: () => {
                                    deleteList.mutate();
                                  },
                                },
                              ],
                            );
                            break;
                          case 2:
                            void Share.share(
                              Platform.select({
                                ios: { url: bskyUrl },
                                default: { message: bskyUrl },
                              }),
                            );
                            break;
                        }
                      },
                    );
                  } else {
                    showActionSheetWithOptions(
                      {
                        options: ["Share", "Cancel"],
                        cancelButtonIndex: 1,
                        ...actionSheetStyles(theme),
                      },
                      (buttonIndex) => {
                        const bskyUrl = `https://bsky.app/${handle}/lists/${rkey}`;
                        switch (buttonIndex) {
                          case 0:
                            void Share.share(
                              Platform.select({
                                ios: { url: bskyUrl },
                                default: { message: bskyUrl },
                              }),
                            );
                            break;
                        }
                      },
                    );
                  }
                }}
              >
                <MoreHorizontalIcon
                  size={18}
                  className="text-neutral-600 dark:text-neutral-300"
                />
              </TouchableOpacity>
            </View>
          ),
        }}
      />
      <View className="flex-1 flex-row">
        <View className="flex-1">
          <Text className="text-2xl font-medium">{info.name}</Text>
          {listType && <Text className="text-lg">{listType}</Text>}
          <Text
            className="text-base leading-5"
            onPress={() => {
              router.push(`/profile/${info.creator.did}`);
            }}
            accessibilityRole="link"
          >
            by @{info.creator.handle}
          </Text>
        </View>
        <Image
          source={{ uri: info.avatar }}
          className="ml-4 h-16 w-16 rounded-lg"
        />
      </View>
      {info.description && (
        <Text className="mt-2 text-base">{info.description}</Text>
      )}
    </View>
  );
};

const ListMembers = ({ query }: { query: ReturnType<typeof useListQuery> }) => {
  if (!query.data) return null;

  const data = query.data.pages.flatMap((page) => page.items);

  return (
    <Tabs.FlashList<AppBskyGraphDefs.ListItemView>
      data={data}
      renderItem={({ item }) => <ListMemberItem item={item} />}
      onEndReachedThreshold={0.6}
      onEndReached={() => query.fetchNextPage()}
    />
  );
};

const ListMemberItem = ({ item }: { item: AppBskyGraphDefs.ListItemView }) => {
  const theme = useTheme();
  return (
    <Link asChild href={`/profile/${item.subject.did}`}>
      <TouchableHighlight
        className="border-b"
        style={{
          borderColor: theme.colors.border,
        }}
      >
        <View
          className={cx(
            "flex-1 flex-row p-2 px-4",
            theme.dark ? "bg-black" : "bg-white",
          )}
        >
          <Image
            source={{ uri: item.subject.avatar }}
            className="h-10 w-10 rounded-full"
            recyclingKey={item.subject.did}
          />
          <View className="ml-2 flex-1">
            {item.subject.displayName && (
              <Text className="text-base">{item.subject.displayName}</Text>
            )}
            <Text>@{item.subject.handle}</Text>
            <Text className="mt-2">{item.subject.description}</Text>
          </View>
        </View>
      </TouchableHighlight>
    </Link>
  );
};
