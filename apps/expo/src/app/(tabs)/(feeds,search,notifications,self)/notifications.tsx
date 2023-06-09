import { useCallback, useEffect, useMemo } from "react";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import {
  type AppBskyFeedDefs,
  type AppBskyNotificationListNotifications,
} from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";

import { ComposeButton } from "../../../components/compose-button";
import { Notification } from "../../../components/notification";
import { QueryWithoutData } from "../../../components/query-without-data";
import { useAuthedAgent } from "../../../lib/agent";
import { useTabPressScrollRef } from "../../../lib/hooks";
import { useAppPreferences } from "../../../lib/hooks/preferences";
import { useRefreshOnFocus, useUserRefresh } from "../../../lib/utils/query";

export type NotificationGroup = {
  reason: AppBskyNotificationListNotifications.Notification["reason"];
  subject: AppBskyNotificationListNotifications.Notification["reasonSubject"];
  item?: AppBskyFeedDefs.ThreadViewPost;
  actors: AppBskyNotificationListNotifications.Notification["author"][];
  isRead: boolean;
  indexedAt: string;
};

interface Props {
  groupNotifications: boolean;
}

const NotificationsPage = ({ groupNotifications }: Props) => {
  const agent = useAuthedAgent();
  const queryClient = useQueryClient();

  const notifications = useInfiniteQuery({
    queryKey: ["notifications", "list", groupNotifications],
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
          agent.getPosts({
            uris: chunk,
          }),
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

  const [ref, onScroll] = useTabPressScrollRef(notifications.refetch);

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
        onScroll={onScroll}
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
  const { appPrefs } = useAppPreferences();

  if (appPrefs.data) {
    return (
      <>
        <NotificationsPage
          groupNotifications={appPrefs.data.groupNotifications}
        />
        <ComposeButton />
      </>
    );
  }

  return <QueryWithoutData query={appPrefs} />;
}
