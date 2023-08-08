import { useRef } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableNativeFeedback,
  View,
} from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  type ComAtprotoLabelDefs,
} from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";

import { Avatar } from "../../../../../../components/avatar";
import { useComposer } from "../../../../../../components/composer";
import { FeedPost } from "../../../../../../components/feed-post";
import { Post } from "../../../../../../components/post";
import { QueryWithoutData } from "../../../../../../components/query-without-data";
import { useAgent } from "../../../../../../lib/agent";
import { useTabPressScroll } from "../../../../../../lib/hooks";
import {
  useContentFilter,
  type FilterResult,
} from "../../../../../../lib/hooks/preferences";
import { assert } from "../../../../../../lib/utils/assert";
import { useUserRefresh } from "../../../../../../lib/utils/query";

export type Posts = {
  post: AppBskyFeedDefs.PostView;
  primary: boolean;
  hasParent: boolean;
  hasReply: boolean;
  filter: FilterResult;
};

interface Props {
  contentFilter: (labels?: ComAtprotoLabelDefs.Label[]) => FilterResult;
}

const PostThread = ({ contentFilter }: Props) => {
  const { handle, id } = useLocalSearchParams() as {
    id: string;
    handle: string;
  };

  const agent = useAgent();
  const ref = useRef<FlashList<Posts>>(null);
  const theme = useTheme();
  const composer = useComposer();

  const thread = useQuery({
    queryKey: ["profile", handle, "post", id],
    queryFn: async () => {
      let did = handle;
      if (!did.startsWith("did:")) {
        const { data } = await agent.resolveHandle({ handle });
        did = data.did;
      }
      const uri = `at://${did}/app.bsky.feed.post/${id}`;
      const postThread = await agent.getPostThread({ uri });

      if (!postThread.success) throw Error("Failed to fetch post thread");

      const thread = postThread.data.thread;

      if (!AppBskyFeedDefs.isThreadViewPost(thread))
        throw Error("Post not found");
      assert(AppBskyFeedDefs.validateThreadViewPost(thread));

      const posts: Posts[] = [];

      // see if has parents
      const ancestors: Posts[] = [];

      let ancestor = thread;
      while (ancestor.parent) {
        if (!AppBskyFeedDefs.isThreadViewPost(ancestor.parent)) break;
        assert(AppBskyFeedDefs.validateThreadViewPost(ancestor.parent));

        const filter = contentFilter(ancestor.parent.post.labels);

        if (filter?.visibility !== "hide") {
          ancestors.push({
            post: ancestor.parent.post,
            primary: false,
            hasParent: false,
            hasReply: true,
            filter,
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
        });
      }

      if (thread.replies) {
        for (const reply of thread.replies) {
          if (!AppBskyFeedDefs.isThreadViewPost(reply)) continue;
          assert(AppBskyFeedDefs.validateThreadViewPost(reply));

          const filter = contentFilter(reply.post.labels);

          if (filter?.visibility !== "hide") {
            posts.push({
              post: reply.post,
              primary: false,
              hasParent: false,
              hasReply: !!reply.replies?.[0],
              filter,
            });
          }

          if (reply.replies && reply.replies[0]) {
            let child;
            child = reply.replies[0];
            while (child) {
              if (!AppBskyFeedDefs.isThreadViewPost(child)) break;
              assert(AppBskyFeedDefs.validateThreadViewPost(child));

              const replyFilter = contentFilter(child.post.labels);

              if (replyFilter?.visibility !== "hide") {
                posts.push({
                  post: child.post,
                  primary: false,
                  hasParent: false,
                  hasReply: !!child.replies?.[0],
                  filter: replyFilter,
                });
              }

              child = child.replies?.[0];
            }
          }
        }
      }

      try {
        const toBeDetected: { uri: string; text: string }[] = [];

        for (const post of posts) {
          if (
            AppBskyFeedPost.isRecord(post.post.record) &&
            post.post.record.text
          ) {
            toBeDetected.push({
              uri: post.post.uri,
              text: post.post.record.text,
            });
          }
        }

        return {
          posts,
          index,
          main: thread.post,
        };
      } catch (err) {
        console.error(err);
        return { posts, index, main: thread.post };
      }
    },
  });

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    thread.refetch,
  );

  const onScroll = useTabPressScroll<Posts>(ref);

  if (thread.data) {
    return (
      <>
        <FlashList<Posts>
          ref={ref}
          onScroll={onScroll}
          data={thread.data.posts}
          estimatedItemSize={150}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={tintColor}
            />
          }
          ListFooterComponent={
            thread.isFetching && !refreshing ? (
              <View className="w-full items-center py-4">
                <ActivityIndicator size="small" />
              </View>
            ) : (
              <View className="h-20" />
            )
          }
          getItemType={(item) => (item.primary ? "big" : "small")}
          renderItem={({ item, index }) =>
            item.primary ? (
              <Post
                post={item.post}
                hasParent={item.hasParent}
                root={thread.data.posts[0]!.post}
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
          }
        />
        <TouchableNativeFeedback
          onPress={() =>
            composer.reply({
              parent: thread.data.main,
              root: thread.data.posts[0]!.post,
            })
          }
        >
          <View
            className="w-full flex-row items-center px-4 py-2"
            style={{
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
              borderTopWidth: StyleSheet.hairlineWidth,
            }}
          >
            <Avatar size="medium" />
            <Text
              className="ml-3 flex-1 text-lg text-neutral-500 dark:text-neutral-400"
              numberOfLines={1}
            >
              Reply to{" "}
              {thread.data.main.author.displayName ??
                `@${thread.data.main.author.handle}`}
            </Text>
          </View>
        </TouchableNativeFeedback>
      </>
    );
  }
  return <QueryWithoutData query={thread} />;
};

export default function PostPage() {
  const { preferences, contentFilter } = useContentFilter();

  if (preferences.data) {
    return (
      <>
        <Stack.Screen options={{ headerTitle: "Post" }} />
        <PostThread contentFilter={contentFilter} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerTitle: "Post" }} />
      <QueryWithoutData query={preferences} />;
    </>
  );
}
