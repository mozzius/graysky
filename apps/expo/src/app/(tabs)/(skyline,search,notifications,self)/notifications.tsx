import { useEffect, useMemo } from "react";
import { ActivityIndicator, Image, Text, View } from "react-native";
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { Link, Stack } from "expo-router";
import {
  AppBskyEmbedImages,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  type AppBskyNotificationListNotifications,
} from "@atproto/api";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Heart, Repeat, UserPlus } from "lucide-react-native";
import { StyledComponent } from "nativewind";

import { Avatar } from "../../../components/avatar";
import { Button } from "../../../components/button";
import { ComposeButton } from "../../../components/compose-button";
import { useDrawer } from "../../../components/drawer-content";
import { Embed } from "../../../components/embed";
import { FeedPost } from "../../../components/feed-post";
import { RichText } from "../../../components/rich-text";
import { useAuthedAgent } from "../../../lib/agent";
import { useTabPressScrollRef } from "../../../lib/hooks";
import { queryClient } from "../../../lib/query-client";
import { assert } from "../../../lib/utils/assert";
import { cx } from "../../../lib/utils/cx";
import { useRefreshOnFocus, useUserRefresh } from "../../../lib/utils/query";
import { timeSince } from "../../../lib/utils/time";

// TOOO: split this file up into like 6 files

type NotificationGroup = {
  reason: AppBskyNotificationListNotifications.Notification["reason"];
  subject: AppBskyNotificationListNotifications.Notification["reasonSubject"];
  actors: AppBskyNotificationListNotifications.Notification["author"][];
  isRead: boolean;
  indexedAt: string;
};

const NotificationsPage = () => {
  const agent = useAuthedAgent();
  const headerHeight = useHeaderHeight();

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

  const { refreshing, handleRefresh } = useUserRefresh(() =>
    notifications
      .refetch()
      .then(() => agent.updateSeenNotifications())
      .then(() =>
        queryClient.invalidateQueries({
          queryKey: ["notifications", "unread"],
        }),
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
      <>
        <Stack.Screen options={{ headerTransparent: true }} />
        <View
          className="w-full border-b border-neutral-200 bg-white dark:border-neutral-600 dark:bg-black"
          style={{ height: headerHeight }}
        />
        <FlashList
          ref={ref}
          data={data}
          renderItem={({ item }) => (
            <Notification
              {...item}
              dataUpdatedAt={notifications.dataUpdatedAt}
            />
          )}
          estimatedItemSize={105}
          onEndReachedThreshold={0.5}
          onEndReached={() => void notifications.fetchNextPage()}
          onRefresh={() => void handleRefresh()}
          refreshing={refreshing}
          ListFooterComponent={
            notifications.isFetching ? (
              <View className="w-full items-center py-4">
                <ActivityIndicator />
              </View>
            ) : null
          }
          extraData={notifications.dataUpdatedAt}
        />
      </>
    );
  }

  if (notifications.error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="mb-4 text-center text-lg dark:text-neutral-50">
          {(notifications.error as Error).message || "An error occurred"}
        </Text>
        <Button variant="outline" onPress={() => void notifications.refetch()}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator />
    </View>
  );
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

const Notification = ({
  reason,
  subject,
  actors,
  isRead,
  indexedAt,
  dataUpdatedAt,
}: NotificationGroup & { dataUpdatedAt: number }) => {
  let href: string | undefined;
  if (subject && subject.startsWith("at://")) {
    const [did, _, id] = subject.slice("at://".length).split("/");
    href = `/profile/${did}/post/${id}`;
  }

  switch (reason) {
    case "like":
      return (
        <NotificationItem
          href={href}
          unread={!isRead}
          left={<Heart size={24} fill="#dc2626" color="#dc2626" />}
        >
          <ProfileList
            actors={actors}
            action="liked your post"
            indexedAt={indexedAt}
          />
          {subject && (
            <PostNotification
              uri={subject}
              unread={!isRead}
              inline
              dataUpdatedAt={dataUpdatedAt}
            />
          )}
        </NotificationItem>
      );
    case "repost":
      return (
        <NotificationItem
          href={href}
          unread={!isRead}
          left={<Repeat size={24} color="#2563eb" />}
        >
          <ProfileList
            actors={actors}
            action="reposted your post"
            indexedAt={indexedAt}
          />
          {subject && (
            <PostNotification
              uri={subject}
              unread={!isRead}
              inline
              dataUpdatedAt={dataUpdatedAt}
            />
          )}
        </NotificationItem>
      );
    case "follow":
      return (
        <NotificationItem
          href={
            actors.length === 1 ? `/profile/${actors[0]!.handle}` : undefined
          }
          unread={!isRead}
          left={<UserPlus size={24} color="#2563eb" />}
        >
          <ProfileList
            actors={actors}
            action="started following you"
            indexedAt={indexedAt}
          />
        </NotificationItem>
      );
    case "reply":
    case "quote":
    case "mention":
      if (!subject) return null;
      return (
        <PostNotification
          uri={subject}
          unread={!isRead}
          dataUpdatedAt={dataUpdatedAt}
        />
      );
    default:
      console.warn("Unknown notification reason", reason);
      return null;
  }
};

const NotificationItem = ({
  left = null,
  children,
  unread,
  href,
}: {
  left?: React.ReactNode;
  children: React.ReactNode;
  unread: boolean;
  href?: string;
}) => {
  const className = cx(
    "flex-row border-b p-2  text-black dark:text-white",
    unread
      ? "border-blue-200 bg-blue-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600"
      : "border-neutral-200 bg-white dark:bg-black dark:border-neutral-600",
  );
  const wrapper = (children: React.ReactNode) =>
    href ? (
      <Link href={href} asChild accessibilityHint="Opens post">
        <StyledComponent
          component={TouchableWithoutFeedback}
          className={className}
        >
          {children}
        </StyledComponent>
      </Link>
    ) : (
      <View className={className}>{children}</View>
    );
  return wrapper(
    <>
      <View className="w-16 shrink-0 items-end px-2">{left}</View>
      <View className="flex-1 px-2">{children}</View>
    </>,
  );
};

const ProfileList = ({
  actors,
  action,
  indexedAt,
}: Pick<NotificationGroup, "actors" | "indexedAt"> & { action: string }) => {
  if (!actors[0]) return null;
  const timeSinceNotif = timeSince(new Date(indexedAt));
  return (
    <View>
      <View className="flex-row">
        {actors.map((actor, index) => (
          <Link
            href={`/profile/${actor.handle}`}
            asChild
            key={actor.did}
            accessibilityHint="Opens profile"
          >
            <StyledComponent
              component={TouchableOpacity}
              className="mr-2 rounded-full"
            >
              <Image
                className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800"
                source={{ uri: actor.avatar }}
                alt={
                  // TODO: find a better way to handle this
                  action === "started following you"
                    ? `${index === 0 ? "New follower: " : ""}${
                        actor.displayName
                      } @${actor.handle}`
                    : ""
                }
              />
            </StyledComponent>
          </Link>
        ))}
      </View>
      <View className="mt-2 flex-row flex-wrap text-base">
        <Text className="text-base font-medium dark:text-neutral-50">
          {actors[0].displayName?.trim() ?? `@${actors[0].handle}`}
          {actors.length > 1 && ` and ${actors.length - 1} others`}
        </Text>
        <Text className="text-base text-neutral-500 dark:text-neutral-400">
          {" " + action}
        </Text>
        <Text
          className="text-base text-neutral-500 dark:text-neutral-400"
          accessibilityLabel={timeSinceNotif.accessible}
        >
          {" · "}
          {timeSinceNotif.visible}
        </Text>
      </View>
    </View>
  );
};

const PostNotification = ({
  uri,
  unread,
  inline,
  dataUpdatedAt,
}: {
  uri: string;
  unread: boolean;
  inline?: boolean;
  dataUpdatedAt: number;
}) => {
  const agent = useAuthedAgent();

  const post = useQuery({
    queryKey: ["notifications", "post", uri],
    queryFn: async () => {
      const { data } = await agent.getPostThread({
        uri: uri,
        depth: 0,
      });

      if (!AppBskyFeedDefs.isThreadViewPost(data.thread))
        throw Error("Post not found");
      assert(AppBskyFeedDefs.validateThreadViewPost(data.thread));

      // convert thread view post to feed view post
      return {
        post: data.thread.post,
        ...(AppBskyFeedDefs.isThreadViewPost(data.thread.parent) &&
        AppBskyFeedDefs.validateThreadViewPost(data.thread.parent).success
          ? {
              reply: {
                parent: data.thread.parent.post,
                // not technically correct but we don't use this field
                root: data.thread.parent.post,
              },
            }
          : {}),
      } satisfies AppBskyFeedDefs.FeedViewPost;
    },
  });

  if (post.data) {
    if (inline) {
      if (!AppBskyFeedPost.isRecord(post.data.post.record)) return null;
      assert(AppBskyFeedPost.validateRecord(post.data.post.record));

      return (
        <View className="mt-0.5">
          {post.data.post.record.text && (
            <Text className="text-neutral-500 dark:text-neutral-400">
              <RichText
                text={post.data.post.record.text}
                facets={post.data.post.record.facets}
                size="sm"
              />
            </Text>
          )}
          {post.data.post.embed &&
            AppBskyEmbedImages.isView(post.data.post.embed) && (
              <Embed
                uri={post.data.post.uri}
                content={post.data.post.embed}
                truncate
                depth={1}
              />
            )}
        </View>
      );
    }

    return (
      <FeedPost
        item={post.data}
        inlineParent
        unread={unread}
        dataUpdatedAt={dataUpdatedAt}
      />
    );
  }

  if (post.error) {
    console.warn(post.error);
    return null;
  }

  if (inline) return <View className="h-10" />;
  return (
    <NotificationItem unread={unread}>
      <View className="h-32" />
    </NotificationItem>
  );
};
