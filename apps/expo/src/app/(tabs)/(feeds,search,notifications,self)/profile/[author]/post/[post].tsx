import { memo, useRef } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { AppBskyFeedDefs, type ComAtprotoLabelDefs } from "@atproto/api";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import {
  LockIcon,
  ShieldQuestionIcon,
  ShieldXIcon,
  Trash2Icon,
} from "lucide-react-native";

import { Avatar } from "~/components/avatar";
import { FeedPost } from "~/components/feed-post";
import { PrimaryPost } from "~/components/primary-post";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text as ThemedText } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useComposer } from "~/lib/composer/utils";
import { useTabPressScroll } from "~/lib/hooks";
import { useContentFilter, type FilterResult } from "~/lib/hooks/preferences";
import { useUserRefresh } from "~/lib/utils/query";

export type Posts =
  | {
      viewable: true;
      post: AppBskyFeedDefs.PostView;
      primary: boolean;
      hasParent: boolean;
      hasReply: boolean;
      filter: FilterResult;
    }
  | {
      viewable: false;
      deleted: boolean;
      blocked: boolean;
      primary: boolean;
      hasReply?: boolean;
    };

interface Props {
  contentFilter: (labels?: ComAtprotoLabelDefs.Label[]) => FilterResult;
}

const PostThread = ({ contentFilter }: Props) => {
  const { author, post } = useLocalSearchParams<{
    post: string;
    author: string;
  }>();

  const agent = useAgent();
  const ref = useRef<FlashListRef<Posts>>(null);
  const theme = useTheme();
  const composer = useComposer();

  const thread = useQuery({
    queryKey: ["profile", author, "post", post],
    queryFn: async () => {
      if (!author || !post) throw Error("Invalid path to post");
      let did = author;
      if (!did.startsWith("did:")) {
        const { data } = await agent.resolveHandle({ handle: author });
        did = data.did;
      }
      const uri = `at://${did}/app.bsky.feed.post/${post}`;
      const postThread = await agent.getPostThread({ uri });

      if (!postThread.success) throw Error("Failed to fetch post thread");

      const thread = postThread.data.thread;

      if (AppBskyFeedDefs.isBlockedPost(thread)) {
        return {
          index: 0,
          main: null,
          posts: [
            {
              viewable: false,
              blocked: true,
              primary: true,
              deleted: false,
            },
          ] as Posts[],
        };
      }
      if (AppBskyFeedDefs.isNotFoundPost(thread)) {
        return {
          index: 0,
          main: null,
          posts: [
            {
              viewable: false,
              deleted: true,
              primary: true,
              blocked: false,
            },
          ] as Posts[],
        };
      }
      if (!AppBskyFeedDefs.isThreadViewPost(thread))
        throw Error("Post not found");

      const posts: Posts[] = [];

      // see if has parents
      const ancestors: Posts[] = [];

      let ancestor = thread;
      while (ancestor.parent) {
        if (!AppBskyFeedDefs.isThreadViewPost(ancestor.parent)) {
          if (AppBskyFeedDefs.isBlockedPost(ancestor.parent)) {
            ancestors.push({
              viewable: false,
              blocked: true,
              primary: false,
              deleted: false,
            });
          }
          if (AppBskyFeedDefs.isNotFoundPost(ancestor.parent)) {
            ancestors.push({
              deleted: true,
              primary: false,
              viewable: false,
              blocked: false,
            });
          }
          break;
        }

        const filter = contentFilter(ancestor.parent.post.labels);

        if (filter?.visibility !== "hide") {
          ancestors.push({
            post: ancestor.parent.post,
            primary: false,
            hasParent: false,
            hasReply: true,
            filter,
            viewable: true,
          });
        }

        ancestor = ancestor.parent;
      }

      const index = ancestors.length;
      ancestors.reverse();
      posts.push(...ancestors);

      const filter = contentFilter(thread.post.labels);
      if (filter?.visibility !== "hide") {
        posts.push({
          post: thread.post,
          primary: true,
          hasParent: !!thread.parent,
          hasReply: false,
          filter,
          viewable: true,
        });
      }

      if (thread.replies) {
        for (const reply of thread.replies) {
          if (!AppBskyFeedDefs.isThreadViewPost(reply)) {
            if (AppBskyFeedDefs.isBlockedPost(reply)) {
              posts.push({
                viewable: false,
                blocked: true,
                primary: false,
                deleted: false,
              });
            }
            if (AppBskyFeedDefs.isNotFoundPost(reply)) {
              posts.push({
                deleted: true,
                primary: false,
                viewable: false,
                blocked: false,
              });
            }
            continue;
          }

          const filter = contentFilter(reply.post.labels);

          if (filter?.visibility !== "hide") {
            posts.push({
              post: reply.post,
              primary: false,
              hasParent: false,
              hasReply: !!reply.replies?.[0],
              filter,
              viewable: true,
            });
          }

          if (reply.replies?.[0]) {
            let child;
            child = reply.replies[0];
            while (child) {
              if (!AppBskyFeedDefs.isThreadViewPost(child)) break;

              const replyFilter = contentFilter(child.post.labels);

              if (replyFilter?.visibility !== "hide") {
                posts.push({
                  post: child.post,
                  primary: false,
                  hasParent: false,
                  hasReply: !!child.replies?.[0],
                  filter: replyFilter,
                  viewable: true,
                });
              }

              child = child.replies?.[0];
            }
          }
        }
      }

      return {
        posts,
        index,
        main: thread.post,
      };
    },
  });

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    thread.refetch,
  );

  const onScroll = useTabPressScroll<Posts>(ref);

  if (thread.data) {
    const posts = thread.data.posts;
    return (
      <>
        <FlashList<Posts>
          removeClippedSubviews
          ref={ref}
          onScroll={onScroll}
          data={posts}
          initialScrollIndex={posts.findIndex((post) => post.primary) ?? 0}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
          ListFooterComponent={
            thread.isFetching && !refreshing ? (
              <View className="w-full items-center py-4">
                <ActivityIndicator />
              </View>
            ) : (
              <View className="h-20" />
            )
          }
          getItemType={(item) => (item.primary ? "big" : "small")}
          renderItem={({ item, index }) =>
            item.viewable ? (
              item.primary ? (
                <PrimaryPost
                  post={item.post}
                  hasParent={item.hasParent}
                  dataUpdatedAt={thread.dataUpdatedAt}
                />
              ) : (
                <FeedPost
                  filter={item.filter}
                  item={{ post: item.post }}
                  hasReply={item.hasReply}
                  isReply={thread.data.posts[index - 1]?.hasReply}
                  dataUpdatedAt={thread.dataUpdatedAt}
                />
              )
            ) : item.blocked ? (
              <BlockedPost />
            ) : item.deleted ? (
              <DeletedPost />
            ) : (
              <UnknownPost />
            )
          }
        />
        {thread.data.main && (
          <TouchableNativeFeedback
            onPress={() => composer.reply(thread.data.main!)}
          >
            <View
              className="w-full flex-row items-center px-4 py-2"
              style={{
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
                borderTopWidth: StyleSheet.hairlineWidth,
              }}
            >
              {thread.data.main.viewer?.replyDisabled ? (
                <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800">
                  <LockIcon
                    size={24}
                    className="text-neutral-500 dark:text-neutral-400"
                  />
                </View>
              ) : (
                <Avatar self size="medium" />
              )}
              <Text
                className="ml-3 flex-1 text-lg text-neutral-500 dark:text-neutral-400"
                numberOfLines={1}
              >
                {thread.data.main.viewer?.replyDisabled ? (
                  <Trans>This thread is locked</Trans>
                ) : (
                  <Trans>
                    Reply to{" "}
                    {thread.data.main.author.displayName ??
                      `@${thread.data.main.author.handle}`}
                  </Trans>
                )}
              </Text>
            </View>
          </TouchableNativeFeedback>
        )}
      </>
    );
  }
  return <QueryWithoutData query={thread} />;
};

export default function PostPage() {
  const { preferences, contentFilter } = useContentFilter();
  const { _ } = useLingui();

  if (preferences.data) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: _(msg`Post`) }} />
        <PostThread contentFilter={contentFilter} />
      </>
    );
  }

  return <Stack.Screen options={{ headerTitle: _(msg`Post`) }} />;
}

const BlockedPost = memo(() => {
  const theme = useTheme();

  return (
    <View className="flex-1 flex-row items-center p-4">
      <ShieldXIcon size={24} color={theme.colors.text} className="mr-4" />
      <ThemedText className="text-base">
        <Trans>Blocked post</Trans>
      </ThemedText>
    </View>
  );
});
BlockedPost.displayName = "BlockedPost";

const DeletedPost = memo(() => {
  const theme = useTheme();

  return (
    <View className="flex-1 flex-row items-center p-4">
      <Trash2Icon size={24} color={theme.colors.text} className="mr-4" />
      <ThemedText className="text-base">
        <Trans>Deleted post</Trans>
      </ThemedText>
    </View>
  );
});
DeletedPost.displayName = "DeletedPost";

const UnknownPost = memo(() => {
  const theme = useTheme();

  return (
    <View className="flex-1 flex-row items-center p-4">
      <ShieldQuestionIcon
        size={24}
        color={theme.colors.text}
        className="mr-4"
      />
      <ThemedText className="text-base">
        <Trans>Replying to some sort of post</Trans>
      </ThemedText>
    </View>
  );
});
UnknownPost.displayName = "UnknownPost";
