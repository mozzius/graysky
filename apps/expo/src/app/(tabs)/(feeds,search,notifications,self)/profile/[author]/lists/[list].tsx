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
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { MoreHorizontalIcon, Share2 } from "lucide-react-native";

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
import {
  useContentFilter,
  useProfileModeration,
  type FilterResult,
} from "~/lib/hooks/preferences";
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
  const { _ } = useLingui();

  const uri = `at://${author}/app.bsky.graph.list/${rkey}`;

  const list = useListQuery(uri);

  const info = list.data?.pages[0]?.list;

  const renderHeader = useCallback(() => {
    if (!info) return null;
    return <ListHeader info={info} author={author} rkey={rkey} />;
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
          <Tabs.Tab name="feed" label={_(msg`Feed`)}>
            <ListFeed uri={uri} />
          </Tabs.Tab>
          <Tabs.Tab name="members" label={_(msg`Members`)}>
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
          <Tabs.Tab name="members" label={_(msg`Members`)}>
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
          title: _(msg`List`),
          headerTitle: "",
          headerBackTitle: _(msg`Back`),
        }}
      />
      <QueryWithoutData query={list} />
    </>
  );
}

const useListQuery = (uri: string) => {
  const agent = useAgent();
  const { _ } = useLingui();

  return useInfiniteQuery({
    queryKey: ["list", uri, "info"],
    queryFn: async ({ pageParam }) => {
      const res = await agent.app.bsky.graph.getList({
        list: uri,
        cursor: pageParam,
      });
      if (!res.success) throw new Error(_(msg`Could not fetch list`));
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });
};

const ListHeader = ({
  info,
  author,
  rkey,
}: {
  info: AppBskyGraphDefs.ListView;
  author?: string;
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
  const { _ } = useLingui();

  const isPinned = savedFeeds.data?.pinned.includes(info.uri);

  const deleteList = useDeleteList(author, rkey);

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
                  options: [_(msg`Unsubscribe from list`), _(msg`Cancel`)],
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
                    resolve(_(msg`Unsubscribed from list`));
                  } else {
                    resolve(null);
                  }
                },
              );
            } else {
              const options = [
                _(msg`Mute all members`),
                _(msg`Block all members`),
              ];
              showActionSheetWithOptions(
                {
                  title: _(msg`Subscribe to ${info.name}`),
                  options: [...options, _(msg`Cancel`)],
                  cancelButtonIndex: options.length,
                  destructiveButtonIndex: [0, 1],
                  ...actionSheetStyles(theme),
                },
                async (buttonIndex) => {
                  switch (buttonIndex) {
                    case 0:
                      await agent.muteModList(info.uri);
                      setViewerState({ muted: true });
                      resolve(_(msg`List muted`));
                      break;
                    case 1: {
                      const block = await agent.blockModList(info.uri);
                      setViewerState({ blocked: block.uri });
                      resolve(_(msg`List blocked`));
                      break;
                    }
                    default:
                      resolve(null);
                      break;
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
                resolve(
                  !isPinned
                    ? _(msg`List favourited`)
                    : _(msg`List unfavourited`),
                ),
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
      purposeText = _(msg`Moderation list`);
      actionText = _(msg`Subscribe to list`);
      actionClass = "bg-blue-500";
      if (info.viewer?.muted) {
        actionText = _(msg`Muted list`);
        actionClass = "bg-neutral-500";
      }
      if (info.viewer?.blocked) {
        actionText = _(msg`Blocking list`);
        actionClass = "bg-red-500";
      }
      break;
    case AppBskyGraphDefs.CURATELIST:
      purposeText = _(msg`User list`);
      purposeClass = "bg-blue-500";
      actionText = _(msg`Add to favourites`);
      actionClass = "bg-blue-500";
      if (isPinned) {
        actionText = _(msg`Unfavorite list`);
        actionClass = "bg-neutral-500";
      }
      break;
  }

  const handleOptions = () => {
    if (!info) return;
    if (info.creator.did === agent.session?.did) {
      const options = [
        info.purpose === AppBskyGraphDefs.CURATELIST
          ? _(msg`Change to moderation list`)
          : _(msg`Change to user list`),
        _(msg`Share`),
        _(msg`Delete list`),
      ] as const;
      showActionSheetWithOptions(
        {
          options: [...options, _(msg`Cancel`)],
          destructiveButtonIndex: 2,
          cancelButtonIndex: options.length,
          ...actionSheetStyles(theme),
        },
        async (buttonIndex) => {
          if (buttonIndex === undefined) return;
          const bskyUrl = `https://bsky.app/profile/${author}/lists/${rkey}`;
          switch (options[buttonIndex]) {
            case _(msg`Delete list`):
              Alert.alert(
                _(msg`Delete list`),
                _(msg`Are you sure you want to delete this list?`),
                [
                  {
                    text: _(msg`Cancel`),
                    style: "cancel",
                  },
                  {
                    text: _(msg`Delete`),
                    style: "destructive",
                    onPress: () => {
                      deleteList.mutate();
                    },
                  },
                ],
              );
              break;
            case _(msg`Share`):
              void Share.share(
                Platform.select({
                  ios: { url: bskyUrl },
                  default: { message: bskyUrl },
                }),
              );
              break;
            case _(msg`Change to user list`):
              // unmute and unblock before changing type
              if (info.viewer?.muted) {
                await agent.unmuteModList(info.uri);
              }
              if (info.viewer?.blocked) {
                await agent.unblockModList(info.uri);
              }
            // eslint-disable-next-line no-fallthrough
            case _(msg`Change to moderation list`): {
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
          options: [_(msg`Share`), _(msg`Cancel`)],
          icons: [
            <Share2 size={24} color={theme.colors.text} key={0} />,
            <></>,
          ],
          cancelButtonIndex: 1,
          ...actionSheetStyles(theme),
        },
        (buttonIndex) => {
          const bskyUrl = `https://bsky.app/profile/${author}/lists/${rkey}`;
          if (buttonIndex === 0) {
            void Share.share(
              Platform.select({
                ios: { url: bskyUrl },
                default: { message: bskyUrl },
              }),
            );
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
          headerBackTitle: _(msg`Back`),
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
            <Trans>by @{info.creator.handle}</Trans>
          </Text>
        </View>
        <Image
          source={{ uri: info.avatar }}
          className={cx("ml-4 h-16 w-16 rounded-lg", purposeClass)}
        />
      </View>
      {info.description && (
        <View className="my-2 flex-1">
          <RichText text={info.description} facets={info.descriptionFacets} />
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
      removeClippedSubviews
      data={data}
      renderItem={({ item }) => <ListMemberItem item={item} />}
      onEndReachedThreshold={2}
      onEndReached={() => query.fetchNextPage()}
      ListFooterComponent={
        <ListFooterComponent
          query={query}
          hideEmptyMessage={data.length === 0}
        />
      }
      ListEmptyComponent={
        <View className="flex-1 items-center justify-center p-8">
          <Text className="text-center text-neutral-500 dark:text-neutral-400">
            <Trans>This list is empty</Trans>
          </Text>
        </View>
      }
    />
  );
};

const ListMemberItem = ({ item }: { item: AppBskyGraphDefs.ListItemView }) => {
  const theme = useTheme();

  const moderation = useProfileModeration(item.subject);

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
          <PostAvatar profile={item.subject} moderation={moderation} />
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
  const { _ } = useLingui();

  const scrollY = Tabs.useCurrentTabScrollY();

  const query = useInfiniteQuery({
    queryKey: ["list", uri, "feed"],
    queryFn: async ({ pageParam }) => {
      const res = await agent.app.bsky.feed.getListFeed({
        list: uri,
        cursor: pageParam,
      });
      if (!res.success) throw new Error(_(msg`Could not fetch list feed`));
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
          removeClippedSubviews
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
          onEndReachedThreshold={2}
          onEndReached={() => query.fetchNextPage()}
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
                <Trans>This list is empty</Trans>
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
  const { _ } = useLingui();

  return useMutation({
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
        title: _(msg`List deleted`),
        message: _(msg`Your list has been deleted`),
      });
    },
    onError: () => {
      showToastable({
        title: _(msg`Error`),
        message: _(msg`Could not delete list`),
        status: "danger",
      });
    },
  });
};
