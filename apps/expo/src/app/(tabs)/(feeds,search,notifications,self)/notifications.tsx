import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl } from "react-native";
import { Stack, useFocusEffect } from "expo-router";
import {
  type AppBskyFeedDefs,
  type AppBskyNotificationListNotifications,
} from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { ListFooterComponent } from "~/components/list-footer";
import { Notification } from "~/components/notification";
import { OpenDrawerAvatar } from "~/components/open-drawer-avatar";
import { QueryWithoutData } from "~/components/query-without-data";
import { useAgent } from "~/lib/agent";
import { useTabPressScrollRef } from "~/lib/hooks";
import { useAppPreferences, useHaptics } from "~/lib/hooks/preferences";
import { useRefreshOnFocus, useUserRefresh } from "~/lib/utils/query";

export interface NotificationGroup {
  reason: AppBskyNotificationListNotifications.Notification["reason"];
  subject: AppBskyNotificationListNotifications.Notification["reasonSubject"];
  item?: AppBskyFeedDefs.ThreadViewPost;
  actors: AppBskyNotificationListNotifications.Notification["author"][];
  isRead: boolean;
  indexedAt: string;
}

function Notifications() {
  const agent = useAgent();
  const queryClient = useQueryClient();
  const [nonScrollRefreshing, setNonScrollRefreshing] = useState(false);
  const haptics = useHaptics();
  const [{ groupNotifications }] = useAppPreferences();

  const notifications = useInfiniteQuery({
    queryKey: ["notifications", "list", groupNotifications],
    queryFn: async ({ pageParam }) => {
      const notifs = await agent.listNotifications({
        cursor: pageParam as string | undefined,
      });
      if (!notifs.success) throw new Error("Failed to fetch notifications");

      const grouped: NotificationGroup[] = [];
      const subjects = new Set<string>();

      if (groupNotifications) {
        for (const notif of notifs.data.notifications) {
          const prior = grouped.find(
            (x) =>
              x.reason === notif.reason && x.subject === notif.reasonSubject,
          );

          if (prior) {
            prior.actors.push(notif.author);
          } else {
            let subject = notif.reasonSubject;

            if (["reply", "quote", "mention"].includes(notif.reason)) {
              subject = notif.uri;
            }

            if (subject) {
              subjects.add(subject);
            }

            grouped.push({
              reason: notif.reason,
              subject,
              actors: [notif.author],
              isRead: notif.isRead,
              indexedAt: notif.indexedAt,
            });
          }
        }
      } else {
        for (const notif of notifs.data.notifications) {
          let subject = notif.reasonSubject;

          if (["reply", "quote", "mention"].includes(notif.reason)) {
            subject = notif.uri;
          }

          if (subject) {
            subjects.add(subject);
          }

          grouped.push({
            reason: notif.reason,
            subject,
            actors: [notif.author],
            isRead: notif.isRead,
            indexedAt: notif.indexedAt,
          });
        }
      }

      // split subjects into chunks of 25
      const subjectChunks = Array.from(subjects).reduce<string[][]>(
        (acc, subject) => {
          if (acc[acc.length - 1]!.length === 25) {
            acc.push([subject]);
          } else {
            acc[acc.length - 1]!.push(subject);
          }
          return acc;
        },
        [[]],
      );

      const contextPosts = await Promise.all(
        subjectChunks.map((chunk) =>
          chunk.length > 0
            ? agent.getPosts({
                uris: chunk,
              })
            : Promise.resolve({ data: { posts: [] } }),
        ),
      ).then((x) => x.flatMap((x) => x.data.posts));

      const notifications = grouped.map((group) => {
        if (group.subject) {
          const post = contextPosts.find((x) => x.uri === group.subject);
          if (post) {
            return {
              ...group,
              item: { post },
            };
          }
        }
        return group;
      }) satisfies NotificationGroup[];

      return {
        cursor: notifs.data.cursor,
        notifications,
      };
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const lastUpdated = notifications.isSuccess
    ? notifications.dataUpdatedAt
    : null;

  const lastUpdatedRef = useRef(lastUpdated);

  useEffect(() => {
    lastUpdatedRef.current = lastUpdated;
  }, [lastUpdated]);

  // update seen notifications when leaving the screen
  useFocusEffect(
    useCallback(() => {
      return () => {
        if (lastUpdatedRef.current) {
          void agent
            .updateSeenNotifications(
              new Date(lastUpdatedRef.current).toISOString(),
            )
            .then(() =>
              queryClient.invalidateQueries({
                queryKey: ["notifications", "unread"],
              }),
            );
        }
      };
    }, [agent, queryClient]),
  );

  const { refetch } = notifications;

  // update notifications when the screen is focused
  useRefreshOnFocus(
    useCallback(async () => {
      await refetch();
    }, [refetch]),
  );

  // update notifications when the user refreshes
  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    useCallback(async () => {
      if (lastUpdatedRef.current) {
        await agent.updateSeenNotifications(
          new Date(lastUpdatedRef.current).toISOString(),
        );
        void queryClient.invalidateQueries({
          queryKey: ["notifications", "unread"],
        });
      }

      await refetch();
    }, [queryClient, agent, refetch]),
  );

  // update notifications when the user presses the tab bar
  const [ref, onScroll] = useTabPressScrollRef<NotificationGroup>(
    useCallback(async () => {
      if (!notifications.isLoading) {
        setNonScrollRefreshing(true);
        haptics.selection();

        if (lastUpdatedRef.current) {
          await agent.updateSeenNotifications(
            new Date(lastUpdatedRef.current).toISOString(),
          );
          void queryClient.invalidateQueries({
            queryKey: ["notifications", "unread"],
          });
        }

        await refetch();

        setNonScrollRefreshing(false);
      }
    }, [refetch, haptics, queryClient, agent, notifications.isLoading]),
    { largeHeader: true },
  );

  const data = useMemo(() => {
    if (!notifications.data) return [];
    const notifs = notifications.data.pages.flatMap(
      (page) => page.notifications,
    );
    return notifs;
  }, [notifications.data]);

  if (notifications.data) {
    return (
      <>
        <Stack.Screen
          options={{
            headerRight: nonScrollRefreshing
              ? () => <ActivityIndicator size="small" />
              : undefined,
          }}
        />
        <FlashList<NotificationGroup>
          contentInsetAdjustmentBehavior="automatic"
          ref={ref}
          onScroll={onScroll}
          scrollToOverflowEnabled
          data={data}
          renderItem={({ item }) => (
            <Notification
              {...item}
              dataUpdatedAt={notifications.dataUpdatedAt}
            />
          )}
          // ListHeaderComponent={
          //   nonScrollRefreshing ? (
          //     <View className="h-16 w-full items-center justify-center">
          //       <ActivityIndicator size="small" />
          //     </View>
          //   ) : null
          // }
          estimatedItemSize={105}
          onEndReachedThreshold={0.6}
          onEndReached={() => notifications.fetchNextPage()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
          ListFooterComponent={<ListFooterComponent query={notifications} />}
          extraData={notifications.dataUpdatedAt}
        />
      </>
    );
  }

  return <QueryWithoutData query={notifications} />;
}

export default function NotificationPage() {
  const headerLeft = useCallback(() => <OpenDrawerAvatar />, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerLargeTitle: true,
          headerLeft,
        }}
      />
      <Notifications />
    </>
  );
}
