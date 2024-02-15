import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Share,
  TouchableHighlight,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import * as Tabs from "react-native-collapsible-tab-view";
import { RefreshControl } from "react-native-gesture-handler";
import { runOnJS, useAnimatedReaction } from "react-native-reanimated";
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
import { FeedsButton } from "~/components/feeds-button";
import { ListFooterComponent } from "~/components/list-footer";
import { PostAvatar } from "~/components/post-avatar";
import { QueryWithoutData } from "~/components/query-without-data";
import { RichText } from "~/components/rich-text";
import { Text } from "~/components/themed/text";
import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useAgent } from "~/lib/agent";
import { useSavedFeeds, useTabPressScrollRef } from "~/lib/hooks";
import { useToggleFeedPref } from "~/lib/hooks/feeds";
import { useContentFilter, type FilterResult } from "~/lib/hooks/preferences";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { cx } from "~/lib/utils/cx";
import { produce } from "~/lib/utils/produce";
import { useUserRefresh } from "~/lib/utils/query";
import { createTopTabsScreenOptions } from "~/lib/utils/top-tabs";

export default function ListsScreen() {
  const { author, list: rkey } = useLocalSearchParams<{
    author: string;
    list: string;
  }>();
  const theme = useTheme();

  const uri = `at://${author}/app.bsky.graph.list/${rkey}`;

  const list = useListQuery(uri);

  const info = list.data?.pages[0]?.list;

  const renderHeader = useCallback(() => {
    if (!info) return null;
    return <ListHeader info={info} handle={author} rkey={rkey} />;
  }, [info, author, rkey]);

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
          <Tabs.Tab name="feed" label="フィード">
            <ListFeed uri={uri} />
          </Tabs.Tab>
          <Tabs.Tab name="members" label="メンバー">
            <ListMembers query={list} />
          </Tabs.Tab>
        </Tabs.Container>
      );
    } else {
      return (
        <Tabs.Container
          renderHeader={renderHeader}
          headerContainerStyle={{ shadowOpacity: 0, elevation: 0 }}
          renderTabBar={() => (
            <View
              className="border-b"
              style={{ borderColor: theme.colors.border }}
            />
          )}
          allowHeaderOverscroll={Platform.OS === "ios"}
        >
          <Tabs.Tab name="members" label="メンバー">
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
          title: "リスト",
          headerTitle: "",
          headerBackTitle: "戻る",
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
      if (!res.success) throw new Error("リストを取得できませんでした");
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
  const savedFeeds = useSavedFeeds();
  const toggleSave = useToggleFeedPref(savedFeeds.data?.preferences);

  const isPinned = savedFeeds.data?.pinned.includes(info.uri);

  const deleteList = useDeleteList(handle, rkey);

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
        switch (info.purpose) {
          case AppBskyGraphDefs.MODLIST:
            if (info.viewer?.blocked || info.viewer?.muted) {
              showActionSheetWithOptions(
                {
                  options: ["Unsubscribe from list", "キャンセル"],
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
              const options = ["Mute all members", "すべてのメンバーをブロック"];
              showActionSheetWithOptions(
                {
                  title: `${info.name}を購読する`,
                  options: [...options, "キャンセル"],
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
            break;
          case AppBskyGraphDefs.CURATELIST:
            void toggleSave
              .mutateAsync({
                pin: info.uri,
              })
              .then(() =>
                resolve(!isPinned ? "お気に入りに登録しているリスト" : "お気に入りに登録していないリスト"),
              );
            break;
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
      purposeText = "User list";
      purposeClass = "bg-blue-500";
      actionText = "Add to favourites";
      actionClass = "bg-blue-500";
      if (isPinned) {
        actionText = "Unfavorite list";
        actionClass = "bg-neutral-500";
      }
      break;
  }

  const handleOptions = () => {
    if (!info) return;
    if (info.creator.did === agent.session?.did) {
      const options = [
        info.purpose === AppBskyGraphDefs.CURATELIST
          ? "Change to moderation list"
          : "Change to user list",
        "Share",
        "Delete list",
      ] as const;
      showActionSheetWithOptions(
        {
          options: [...options, "キャンセル"],
          destructiveButtonIndex: 2,
          cancelButtonIndex: options.length,
          ...actionSheetStyles(theme),
        },
        async (buttonIndex) => {
          if (buttonIndex === undefined) return;
          const bskyUrl = `https://bsky.app/profile/${handle}/lists/${rkey}`;
          switch (options[buttonIndex]) {
            case "リストを削除":
              Alert.alert(
                "リストを削除",
                "本当にこのリストを削除しますか?",
                [
                  {
                    text: "キャンセル",
                    style: "cancel",
                  },
                  {
                    text: "削除",
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
            case "ユーザーリストに変更":
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
          options: ["共有", "キャンセル"],
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
          title: info?.name ?? "リスト",
          headerTitle: "",
          headerBackTitle: "戻る",
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
        <View className="my-2 flex-1">
          <RichText
            text={info.description}
            facets={info.descriptionFacets}
            size="base"
          />
        </View>
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
  const [scrollDir, setScrollDir] = useState(0);

  const scrollY = Tabs.useCurrentTabScrollY();

  const query = useInfiniteQuery({
    queryKey: ["list", uri, "feed"],
    queryFn: async ({ pageParam }) => {
      const res = await agent.app.bsky.feed.getListFeed({
        list: uri,
        cursor: pageParam,
      });
      if (!res.success) throw new Error("リストフィードを取得できませんでした");
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const [ref, onScroll] = useTabPressScrollRef<{
    item: AppBskyFeedDefs.FeedViewPost;
    filter: FilterResult;
  }>(query.refetch, { setScrollDir });

  const onScrollWorkaround = useCallback(
    (num: number) =>
      onScroll({
        nativeEvent: { contentOffset: { y: num, x: 0 } },
      } as NativeSyntheticEvent<NativeScrollEvent>),
    [onScroll],
  );

  useAnimatedReaction(
    () => scrollY.value,
    (scrollY) => runOnJS(onScrollWorkaround)(scrollY),
    [scrollY],
  );

  const { handleRefresh, refreshing, tintColor } = useUserRefresh(
    query.refetch,
  );

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
      <>
        <Tabs.FlashList<{
          item: AppBskyFeedDefs.FeedViewPost;
          filter: FilterResult;
        }>
          estimatedItemSize={264}
          contentInsetAdjustmentBehavior="automatic"
          ref={ref}
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
              tintColor={tintColor}
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

        {scrollDir <= 0 && <FeedsButton />}
      </>
    );
  }

  return <QueryWithoutData query={query} />;
};

const useDeleteList = (handle?: string, rkey?: string) => {
  const agent = useAgent();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      if (!handle || !rkey) throw new Error("ルートパラメータが見つかりません");
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
        title: "リストを削除しました",
        message: "リストが削除されました",
      });
    },
    onError: () => {
      showToastable({
        title: "エラー",
        message: "リストを削除できませんでした",
        status: "danger",
      });
    },
  });
};
