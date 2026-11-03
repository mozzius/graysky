import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, RefreshControl } from "react-native";
import * as ExpoNotifications from "expo-notifications";
import { Stack, useFocusEffect } from "expo-router";
import { toDatetimeString, type AtUriString } from "@atproto/lex";
import { updateSeenNotifications } from "@bsky/sdk";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { ListFooterComponent } from "~/components/list-footer";
import { Notification } from "~/components/notification";
import {
  OpenDrawerAvatar,
  useOpenDrawerAvatarItem,
} from "~/components/open-drawer-avatar";
import { QueryWithoutData } from "~/components/query-without-data";
import { usePlainBackgroundColor } from "~/components/themed/background";
import { useAgent } from "~/lib/agent";
import { useTabPressScrollRef } from "~/lib/hooks";
import { useHaptics } from "~/lib/hooks/preferences";
import { useGroupNotifications } from "~/lib/storage/app-preferences";
import { useRefreshOnFocus, useUserRefresh } from "~/lib/utils/query";
import { isIOS26 } from "~/lib/utils/version";

export interface NotificationGroup {
  reason: app.bsky.notification.listNotifications.Notification["reason"];
  subject: app.bsky.notification.listNotifications.Notification["reasonSubject"];
  item?: app.bsky.feed.defs.ThreadViewPost;
  actors: app.bsky.notification.listNotifications.Notification["author"][];
  isRead: boolean;
  indexedAt: string;
}

function Notifications() {
  const agent = useAgent();
  const queryClient = useQueryClient();
  const [nonScrollRefreshing, setNonScrollRefreshing] = useState(false);
  const haptics = useHaptics();
  const groupNotifications = useGroupNotifications();

  const notifications = useInfiniteQuery({
    queryKey: ["notifications", "list", groupNotifications],
    queryFn: async ({ pageParam }) => {
      const notifs = await agent.call(app.bsky.notification.listNotifications, {
        cursor: pageParam,
      });

      const grouped: NotificationGroup[] = [];
      const subjects = new Set<AtUriString>();

      if (groupNotifications) {
        for (const notif of notifs.notifications) {
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
        for (const notif of notifs.notifications) {
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
      const subjectChunks = Array.from(subjects).reduce<AtUriString[][]>(
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
            ? agent.call(app.bsky.feed.getPosts, {
                uris: chunk,
              })
            : Promise.resolve({ posts: [] }),
        ),
      ).then((x) => x.flatMap((x) => x.posts));

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
        cursor: notifs.cursor,
        notifications,
      };
    },
    initialPageParam: undefined as string | undefined,
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
            .call(
              updateSeenNotifications,
              toDatetimeString(new Date(lastUpdatedRef.current)),
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
        await agent.call(
          updateSeenNotifications,
          toDatetimeString(new Date(lastUpdatedRef.current)),
        );
        void ExpoNotifications.setBadgeCountAsync(0);
        void ExpoNotifications.dismissAllNotificationsAsync();
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
      if (!notifications.isPending) {
        setNonScrollRefreshing(true);
        haptics.selection();

        if (lastUpdatedRef.current) {
          await agent.call(
            updateSeenNotifications,
            toDatetimeString(new Date(lastUpdatedRef.current)),
          );
          void ExpoNotifications.setBadgeCountAsync(0);
          void ExpoNotifications.dismissAllNotificationsAsync();
          void queryClient.invalidateQueries({
            queryKey: ["notifications", "unread"],
          });
        }

        await refetch();

        setNonScrollRefreshing(false);
      }
    }, [refetch, haptics, queryClient, agent, notifications.isPending]),
    { largeHeader: isIOS26 },
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
          removeClippedSubviews
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
          onEndReachedThreshold={2}
          onEndReached={() => notifications.fetchNextPage()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
          ListFooterComponent={
            <ListFooterComponent
              query={notifications}
              hideEmptyMessage={data.length === 0}
            />
          }
        />
      </>
    );
  }

  return <QueryWithoutData query={notifications} />;
}

export default function NotificationPage() {
  const { _ } = useLingui();
  const headerLeft = useCallback(() => <OpenDrawerAvatar />, []);
  const avatarItem = useOpenDrawerAvatarItem();
  const headerItemsLeft = () => [avatarItem];
  const backgroundColor = usePlainBackgroundColor();

  return (
    <>
      <Stack.Screen
        options={{
          title: _(msg`Notifications`),
          headerLeft,
          unstable_headerLeftItems: headerItemsLeft,
          headerLargeTitle: isIOS26,
          headerTransparent: isIOS26,
          contentStyle: { backgroundColor },
        }}
      />
      <Notifications />
    </>
  );
}
