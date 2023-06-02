import { useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Stack } from "expo-router";
import { type AppBskyNotificationListNotifications } from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery } from "@tanstack/react-query";

import { Avatar } from "../../../components/avatar";
import { ComposeButton } from "../../../components/compose-button";
import { useDrawer } from "../../../components/drawer-content";
import { Notification } from "../../../components/notification";
import { QueryWithoutData } from "../../../components/query-without-data";
import { useAuthedAgent } from "../../../lib/agent";
import { useTabPressScrollRef } from "../../../lib/hooks";
import { queryClient } from "../../../lib/query-client";
import { useRefreshOnFocus, useUserRefresh } from "../../../lib/utils/query";

export type NotificationGroup = {
  reason: AppBskyNotificationListNotifications.Notification["reason"];
  subject: AppBskyNotificationListNotifications.Notification["reasonSubject"];
  actors: AppBskyNotificationListNotifications.Notification["author"][];
  isRead: boolean;
  indexedAt: string;
};

const NotificationsPage = () => {
  const agent = useAuthedAgent();

  const notifications = useInfiniteQuery({
    queryKey: ["notifications", "list"],
    queryFn: async ({ pageParam }) => {
      const notifs = await agent.listNotifications({
        cursor: pageParam as string | undefined,
      });
      if (!notifs.success) throw new Error("Failed to fetch notifications");
      // refetch the post queries so they update
      void queryClient.invalidateQueries({
        queryKey: ["notifications", "post"],
        exact: false,
      });

      const grouped: NotificationGroup[] = [];
      for (const notif of notifs.data.notifications) {
        const prior = grouped.find(
          (x) => x.reason === notif.reason && x.subject === notif.reasonSubject,
        );
        if (prior) {
          prior.actors.push(notif.author);
        } else {
          let subject = notif.reasonSubject;
          if (["reply", "quote", "mention"].includes(notif.reason)) {
            subject = notif.uri;
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
      return {
        cursor: notifs.data.cursor,
        notifications: grouped,
      };
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const hasData = !!notifications.data;

  useEffect(() => {
    if (!hasData) return;
    const timeout = setTimeout(() => {
      void agent.updateSeenNotifications().then(() =>
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread"],
        }),
      );
    }, 3000);
    return () => clearTimeout(timeout);
  }, [agent, hasData, notifications.dataUpdatedAt]);

  useRefreshOnFocus(notifications.refetch);

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    useCallback(
      () =>
        notifications
          .refetch()
          .then(() => agent.updateSeenNotifications())
          .then(() =>
            queryClient.invalidateQueries({
              queryKey: ["notifications", "unread"],
            }),
          ),
      [agent, notifications],
    ),
  );

  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  const ref = useTabPressScrollRef(notifications.refetch);

  const data = useMemo(() => {
    if (!notifications.data) return [];
    const notifs = notifications.data.pages.flatMap(
      (page) => page.notifications,
    );
    return notifs;
  }, [notifications.data]);

  if (notifications.data) {
    return (
      <FlashList
        ref={ref}
        data={data}
        renderItem={({ item }) => (
          <Notification {...item} dataUpdatedAt={notifications.dataUpdatedAt} />
        )}
        estimatedItemSize={105}
        onEndReachedThreshold={0.6}
        onEndReached={() => void notifications.fetchNextPage()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={tintColor}
          />
        }
        ListFooterComponent={
          notifications.isFetching ? (
            <View className="w-full items-center py-4">
              <ActivityIndicator />
            </View>
          ) : null
        }
        extraData={notifications.dataUpdatedAt}
      />
    );
  }

  return <QueryWithoutData query={notifications} />;
};

export default function Page() {
  const openDrawer = useDrawer();
  return (
    <>
      <Stack.Screen
        options={{
          title: "Notifications",
          headerLeft: () => (
            <TouchableOpacity onPress={openDrawer}>
              <Avatar size="small" />
            </TouchableOpacity>
          ),
        }}
      />
      <NotificationsPage />
      <ComposeButton />
    </>
  );
}
