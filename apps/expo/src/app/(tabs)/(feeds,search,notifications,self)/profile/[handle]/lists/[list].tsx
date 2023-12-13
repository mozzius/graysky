import { useCallback, useMemo } from "react";
import {
  Alert,
  Platform,
  Share,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import * as Tabs from "react-native-collapsible-tab-view";
import { RefreshControl } from "react-native-gesture-handler";
import { showToastable } from "react-native-toastable";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AppBskyGraphDefs, type AppBskyFeedDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react-native";

import { FeedPost } from "~/components/feed-post";
import { ListFooterComponent } from "~/components/list-footer";
import { PostAvatar } from "~/components/post-avatar";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useAgent } from "~/lib/agent";
import { useTabPressScrollRef } from "~/lib/hooks";
import { useContentFilter, type FilterResult } from "~/lib/hooks/preferences";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { cx } from "~/lib/utils/cx";
import { produce } from "~/lib/utils/produce";
import { useUserRefresh } from "~/lib/utils/query";
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
          allowHeaderOverscroll={Platform.OS === "ios"}
        >
          <Tabs.Tab name="feed">
            <ListFeed uri={uri} />
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
          allowHeaderOverscroll={Platform.OS === "ios"}
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
          headerBackTitle: "Back",
        }}
      />
      <QueryWithoutData query={list} />
    </>
  );
}

const useListQuery = (uri: string) => {
  const agent = useAgent();
  return useInfiniteQuery({
    queryKey: ["list", uri, "info"],
    queryFn: async ({ pageParam }) => {
      const res = await agent.app.bsky.graph.getList({
        list: uri,
        cursor: pageParam,
      });
      if (!res.success) throw new Error("Could not fetch list");
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
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
  const queryClient = useQueryClient();
  const path = useAbsolutePath();

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

  const setViewerState = (viewer: AppBskyGraphDefs.ListViewerState) => {
    queryClient.setQueryData(
      ["list", info.uri, "info"],
      (old: ReturnType<typeof useListQuery>["data"]) => {
        if (!old) return;
        return produce(old, (draft) => {
          if (draft.pages[0]) {
            draft.pages[0].list.viewer = viewer;
          }
        });
      },
    );
  };

  const subscribe = useMutation({
    mutationFn: () =>
      new Promise<string | null>((resolve) => {
        if (info.viewer?.blocked || info.viewer?.muted) {
          showActionSheetWithOptions(
            {
              options: ["Unsubscribe from list", "Cancel"],
              cancelButtonIndex: 1,
              ...actionSheetStyles(theme),
            },
            async (buttonIndex) => {
              if (buttonIndex === 0) {
                if (info.viewer?.muted) {
                  await agent.unmuteModList(info.uri);
                }
                if (info.viewer?.blocked) {
                  await agent.unblockModList(info.uri);
                }
                setViewerState({
                  blocked: undefined,
                  muted: undefined,
                });
                resolve("Unsubscribed from list");
              } else {
                resolve(null);
              }
            },
          );
        } else {
          const options = ["Mute all members", "Block all members"];
          showActionSheetWithOptions(
            {
              title: `Subscribe to ${info.name}`,
              options: [...options, "Cancel"],
              cancelButtonIndex: options.length,
              destructiveButtonIndex: [0, 1],
              ...actionSheetStyles(theme),
            },
            async (buttonIndex) => {
              if (buttonIndex === undefined) {
                resolve(null);
              } else {
                const answer = options[buttonIndex];
                switch (answer) {
                  case "Mute all members":
                    await agent.muteModList(info.uri);
                    setViewerState({ muted: true });
                    resolve("List muted");
                    break;
                  case "Block all members": {
                    const block = await agent.blockModList(info.uri);
                    setViewerState({ blocked: block.uri });
                    resolve("List blocked");
                    break;
                  }
                  default:
                    resolve(null);
                    break;
                }
              }
            },
          );
        }
      }),
    onSuccess: (message) => {
      if (message) {
        showToastable({
          message,
        });
      }
    },
    onSettled: () =>
      queryClient.refetchQueries({ queryKey: ["list", info.uri, "info"] }),
  });

  let purposeText: string | null = null;
  let actionText: string | null = null;
  let actionClass: string | null = null;
  let purposeClass = "bg-neutral-500";
  switch (info.purpose) {
    case AppBskyGraphDefs.MODLIST:
      purposeText = "Moderation list";
      actionText = "Subscribe to list";
      actionClass = "bg-blue-500";
      if (info.viewer?.muted) {
        actionText = "Muted list";
        actionClass = "bg-neutral-500";
      }
      if (info.viewer?.blocked) {
        actionText = "Blocking list";
        actionClass = "bg-red-500";
      }
      break;
    case AppBskyGraphDefs.CURATELIST:
      purposeText = "Curation list";
      purposeClass = "bg-blue-500";
      break;
  }

  const handleOptions = () => {
    if (!info) return;
    if (info.creator.did === agent.session?.did) {
      const options = [
        info.purpose === AppBskyGraphDefs.CURATELIST
          ? "Change to moderation list"
          : "Change to curation list",
        "Share",
        "Delete list",
      ] as const;
      showActionSheetWithOptions(
        {
          options: [...options, "Cancel"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: options.length,
          ...actionSheetStyles(theme),
        },
        async (buttonIndex) => {
          if (buttonIndex === undefined) return;
          const bskyUrl = `https://bsky.app/profile/${handle}/lists/${rkey}`;
          switch (options[buttonIndex]) {
            case "Delete list":
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
            case "Share":
              void Share.share(
                Platform.select({
                  ios: { url: bskyUrl },
                  default: { message: bskyUrl },
                }),
              );
              break;
            case "Change to curation list":
              // unmute and unblock before changing type
              if (info.viewer?.muted) {
                await agent.unmuteModList(info.uri);
              }
              if (info.viewer?.blocked) {
                await agent.unblockModList(info.uri);
              }
            // eslint-disable-next-line no-fallthrough
            case "Change to moderation list": {
              const collection = "app.bsky.graph.list";
              const repo = agent.session!.did;
              const rkey = info.uri.split("/").pop()!;
              const record = await agent.com.atproto.repo.getRecord({
                collection,
                repo,
                rkey,
              });
              await agent.com.atproto.repo.putRecord({
                collection,
                repo,
                rkey,
                record: {
                  ...record.data.value,
                  purpose:
                    info.purpose === AppBskyGraphDefs.CURATELIST
                      ? AppBskyGraphDefs.MODLIST
                      : AppBskyGraphDefs.CURATELIST,
                },
              });
              await queryClient.refetchQueries({
                queryKey: ["list", info.uri, "info"],
              });
              break;
            }
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
          const bskyUrl = `https://bsky.app/profile/${handle}/lists/${rkey}`;
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
  };

  return (
    <View
      className="flex-1 px-4 pb-2 pt-4"
      style={{ backgroundColor: theme.colors.card }}
    >
      <Stack.Screen
        options={{
          title: info?.name ?? "List",
          headerTitle: "",
          headerBackTitle: "Back",
          headerRight: () => (
            <View className="flex-row">
              {actionText && (
                <TouchableOpacity
                  className={cx(
                    "mr-2 items-center rounded-full px-4",
                    actionClass,
                    subscribe.isPending && "opacity-50",
                  )}
                  disabled={subscribe.isPending}
                  onPress={() => subscribe.mutate()}
                >
                  <Text className="text-base font-bold leading-7 text-white">
                    {actionText}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                className="rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700"
                onPress={handleOptions}
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
          {purposeText && <Text className="text-lg">{purposeText}</Text>}
          <Text
            className="text-base leading-5"
            onPress={() => {
              router.push(path(`/profile/${info.creator.did}`));
            }}
            accessibilityRole="link"
          >
            by @{info.creator.handle}
          </Text>
        </View>
        <Image
          source={{ uri: info.avatar }}
          className={cx("ml-4 h-16 w-16 rounded-lg", purposeClass)}
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
      onEndReachedThreshold={2}
      onEndReached={() => query.fetchNextPage()}
      estimatedItemSize={140}
      ListFooterComponent={
        <ListFooterComponent
          query={query}
          hideEmptyMessage={data.length === 0}
        />
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-center text-neutral-500 dark:text-neutral-400">
            This list is empty
          </Text>
        </View>
      }
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
          <PostAvatar profile={item.subject} />
          <View className="ml-2 flex-1">
            {item.subject.displayName && (
              <Text className="text-base font-medium">
                {item.subject.displayName}
              </Text>
            )}
            <Text className="text-neutral-500">@{item.subject.handle}</Text>
            <Text className="mb-1 mr-2 mt-2">{item.subject.description}</Text>
          </View>
        </View>
      </TouchableHighlight>
    </Link>
  );
};

const ListFeed = ({ uri }: { uri: string }) => {
  const agent = useAgent();
  const { contentFilter } = useContentFilter();
  const theme = useTheme();

  const query = useInfiniteQuery({
    queryKey: ["list", uri, "feed"],
    queryFn: async ({ pageParam }) => {
      const res = await agent.app.bsky.feed.getListFeed({
        list: uri,
        cursor: pageParam,
      });
      if (!res.success) throw new Error("Could not fetch list feed");
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const [ref, onScroll] = useTabPressScrollRef<{
    item: AppBskyFeedDefs.FeedViewPost;
    filter: FilterResult;
  }>(query.refetch);
  const { handleRefresh, refreshing } = useUserRefresh(query.refetch);

  const data = useMemo(() => {
    if (!query.data) return [];
    return query.data.pages
      .flatMap((page) => page.feed)
      .map((item) => ({
        item,
        filter: contentFilter(item.post.labels),
      }));
  }, [query.data, contentFilter]);

  if (query.data) {
    return (
      <Tabs.FlashList<{
        item: AppBskyFeedDefs.FeedViewPost;
        filter: FilterResult;
      }>
        estimatedItemSize={264}
        contentInsetAdjustmentBehavior="automatic"
        ref={ref}
        onScroll={onScroll}
        data={data}
        renderItem={({ item }) => (
          <FeedPost
            {...item}
            inlineParent
            dataUpdatedAt={query.dataUpdatedAt}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.text}
          />
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center p-8">
            <Text className="text-center text-neutral-500 dark:text-neutral-400">
              This list is empty
            </Text>
          </View>
        }
        ListFooterComponent={
          <ListFooterComponent
            query={query}
            hideEmptyMessage={data.length === 0}
          />
        }
      />
    );
  }

  return <QueryWithoutData query={query} />;
};
