/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { Avatar } from "../../../../../../components/avatar";
import { useComposer } from "../../../../../../components/composer";
import { FeedPost } from "../../../../../../components/feed-post";
import { Post } from "../../../../../../components/post";
import { QueryWithoutData } from "../../../../../../components/query-without-data";
import { useAuthedAgent } from "../../../../../../lib/agent";
import { useTabPressScroll } from "../../../../../../lib/hooks";
import { assert } from "../../../../../../lib/utils/assert";
import { useUserRefresh } from "../../../../../../lib/utils/query";
import { AppBskyFeedDefs } from "@atproto/api";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Stack, useLocalSearchParams } from "expo-router";
import { useRef } from "react";
import { Text, TouchableNativeFeedback, View } from "react-native";

type Posts = {
  post: AppBskyFeedDefs.PostView;
  primary: boolean;
  hasParent: boolean;
  hasReply: boolean;
};

export default function PostPage() {
  const { handle, id } = useLocalSearchParams() as {
    id: string;
    handle: string;
  };

  const agent = useAuthedAgent();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<FlashList<any>>(null);

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

        ancestors.push({
          post: ancestor.parent.post,
          primary: false,
          hasParent: false,
          hasReply: true,
        });

        ancestor = ancestor.parent;
      }

      const index = ancestors.length;
      ancestors.reverse();
      posts.push(...ancestors);

      posts.push({
        post: thread.post,
        primary: true,
        hasParent: !!thread.parent,
        hasReply: false,
      });

      if (thread.replies) {
        for (const reply of thread.replies) {
          if (!AppBskyFeedDefs.isThreadViewPost(reply)) continue;
          assert(AppBskyFeedDefs.validateThreadViewPost(reply));

          posts.push({
            post: reply.post,
            primary: false,
            hasParent: false,
            hasReply: !!reply.replies?.[0],
          });

          if (reply.replies && reply.replies[0]) {
            let child;
            child = reply.replies[0];
            while (child) {
              if (!AppBskyFeedDefs.isThreadViewPost(child)) break;
              assert(AppBskyFeedDefs.validateThreadViewPost(child));

              posts.push({
                post: child.post,
                primary: false,
                hasParent: false,
                hasReply: !!child.replies?.[0],
              });

              child = child.replies?.[0];
            }
          }
        }
      }

      return { posts, index, main: thread.post };
    },
  });

  const { refreshing, handleRefresh } = useUserRefresh(thread.refetch);

  useTabPressScroll(ref);

  const composer = useComposer();

  return (
    <>
      <Stack.Screen options={{ headerTitle: "Post" }} />
      {thread.data ? (
        <>
          <FlashList
            ref={ref}
            data={thread.data.posts}
            estimatedItemSize={150}
            onRefresh={() => void handleRefresh()}
            initialScrollIndex={thread.data.index}
            refreshing={refreshing}
            ListFooterComponent={<View className="h-20" />}
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
              composer.open({
                parent: thread.data.main,
                root: thread.data.posts[0]!.post,
              })
            }
          >
            <View className="bg-white items-center px-4 w-full py-2 flex-row dark:bg-black border-t border-neutral-100 dark:border-neutral-700">
              <Avatar size="medium" />
              <Text
                className="text-lg ml-2 text-neutral-400 flex-1"
                numberOfLines={1}
              >
                Reply to{" "}
                {thread.data.main.author.displayName ??
                  `@${thread.data.main.author.handle}`}
              </Text>
            </View>
          </TouchableNativeFeedback>
        </>
      ) : (
        <QueryWithoutData query={thread} />
      )}
    </>
  );
}
