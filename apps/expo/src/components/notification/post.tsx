import { Text, View } from "react-native";
import {
  AppBskyEmbedImages,
  AppBskyFeedDefs,
  AppBskyFeedPost,
} from "@atproto/api";
import { useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../../lib/agent";
import { assert } from "../../lib/utils/assert";
import { Embed } from "../embed";
import { FeedPost } from "../feed-post";
import { RichText } from "../rich-text";
import { NotificationItem } from "./item";

export const PostNotification = ({
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
              } satisfies AppBskyFeedDefs.ReplyRef,
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
