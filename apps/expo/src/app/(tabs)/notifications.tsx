import { useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link, Stack } from "expo-router";
import {
  AppBskyEmbedImages,
  AppBskyFeedDefs,
  AppBskyFeedPost,
  AppBskyNotificationListNotifications,
} from "@atproto/api";
import { useHeaderHeight } from "@react-navigation/elements";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Heart, Repeat, UserPlus } from "lucide-react-native";

import { Button } from "../../components/button";
import { ComposerProvider } from "../../components/composer";
import { Embed } from "../../components/embed";
import { FeedPost } from "../../components/feed-post";
import { RichText } from "../../components/rich-text";
import { useAuthedAgent } from "../../lib/agent";
import { useTabPressScrollRef } from "../../lib/hooks";
import { queryClient } from "../../lib/query-client";
import { assert } from "../../lib/utils/assert";
import { cx } from "../../lib/utils/cx";
import { useRefreshOnFocus, useUserRefresh } from "../../lib/utils/query";
import { timeSince } from "../../lib/utils/time";

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
      // mark as read
      if (pageParam === undefined) {
        agent.updateSeenNotifications().then(() => {
          queryClient.invalidateQueries({
            queryKey: ["notifications", "unread"],
          });
        });
      }
      // refetch the post queries so they update
      // TODO: this doesn't seem to work!
      queryClient.invalidateQueries({
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

  useRefreshOnFocus(notifications.refetch);

  const { refreshing, handleRefresh } = useUserRefresh(notifications.refetch);

  const ref = useTabPressScrollRef(notifications.refetch);

  const data = useMemo(() => {
    if (!notifications.data) return [];
    const notifs = notifications.data.pages.flatMap(
      (page) => page.notifications,
    );
    return notifs;
  }, [notifications.data]);

  switch (notifications.status) {
    case "loading":
      return (
        <View className="flex-1 items-center justify-center">
          <Stack.Screen options={{ headerShown: true }} />
          <ActivityIndicator />
        </View>
      );
    case "error":
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Stack.Screen options={{ headerShown: true }} />
          <Text className="text-center text-lg">
            {(notifications.error as Error).message || "An error occurred"}
          </Text>
          <Button
            variant="outline"
            onPress={() => void notifications.refetch()}
            className="mt-4"
          >
            Retry
          </Button>
        </View>
      );
    case "success":
      return (
        <>
          <Stack.Screen
            options={{ headerShown: true, headerTransparent: true }}
          />
          <View
            className="w-full border-b border-neutral-200 bg-white"
            style={{ height: headerHeight }}
          />
          <FlashList
            ref={ref}
            data={data}
            renderItem={({ item }) => <Notification {...item} />}
            estimatedItemSize={105}
            onEndReachedThreshold={0.5}
            onEndReached={() => void notifications.fetchNextPage()}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            ListFooterComponent={
              notifications.isFetching ? (
                <View className="w-full items-center py-4">
                  <ActivityIndicator />
                </View>
              ) : null
            }
          />
        </>
      );
  }
};

export default function Page() {
  return (
    <ComposerProvider>
      <NotificationsPage />
    </ComposerProvider>
  );
}

const Notification = ({
  reason,
  subject,
  actors,
  isRead,
  indexedAt,
}: NotificationGroup) => {
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
            <PostNotification uri={subject} unread={!isRead} inline />
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
            <PostNotification uri={subject} unread={!isRead} inline />
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
      return <PostNotification uri={subject} unread={!isRead} />;
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
    "flex-row border-b p-2",
    unread ? "border-blue-200 bg-blue-50" : "border-neutral-200 bg-white",
  );
  const wrapper = (children: React.ReactNode) =>
    href ? (
      <Link href={href} asChild>
        <TouchableOpacity className={className}>{children}</TouchableOpacity>
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
  return (
    <View>
      <View className="flex-row">
        {actors.map((actor) => (
          <Link href={`/profile/${actor.handle}`} asChild key={actor.did}>
            <TouchableOpacity className="mr-2 rounded-full">
              <Image
                className="h-8 w-8 rounded-full bg-neutral-200"
                source={{ uri: actor.avatar }}
                alt={actor.displayName}
              />
            </TouchableOpacity>
          </Link>
        ))}
      </View>
      <Text className="mt-2 text-base">
        <Text className="font-medium">
          {actors[0].displayName?.trim() ?? `@${actors[0].handle}`}
          {actors.length > 1 && ` and ${actors.length - 1} others`}
        </Text>
        {" " + action}
        <Text className="text-neutral-500">
          {" · " + timeSince(new Date(indexedAt))}
        </Text>
      </Text>
    </View>
  );
};

const PostNotification = ({
  uri,
  unread,
  inline,
}: {
  uri: string;
  unread: boolean;
  inline?: boolean;
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

  switch (post.status) {
    case "loading":
      if (inline) return <View className="h-10" />;
      return (
        <NotificationItem unread={unread}>
          <View className="h-32" />
        </NotificationItem>
      );
    case "error":
      console.warn(post.error);
      return null;
    case "success":
      if (inline) {
        if (!AppBskyFeedPost.isRecord(post.data.post.record)) return null;
        assert(AppBskyFeedPost.validateRecord(post.data.post.record));

        return (
          <View className="mt-0.5">
            <Text className="text-neutral-500">
              <RichText
                text={post.data.post.record.text}
                facets={post.data.post.record.facets}
                size="sm"
              />
            </Text>
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

      return <FeedPost item={post.data} inlineParent unread={unread} />;
  }
};
