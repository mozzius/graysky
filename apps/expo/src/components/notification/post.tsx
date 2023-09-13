import { View } from "react-native";
import {
  AppBskyEmbedImages,
  AppBskyFeedPost,
  type AppBskyFeedDefs,
} from "@atproto/api";

import { useContentFilter } from "~/lib/hooks/preferences";
import { assert } from "~/lib/utils/assert";
import { Embed } from "../embed";
import { FeedPost } from "../feed-post";
import { RichText } from "../rich-text";
import { Text } from "../text";
import { NotificationItem } from "./item";

interface Props {
  item: AppBskyFeedDefs.ThreadViewPost;
  unread: boolean;
  inline?: boolean;
  dataUpdatedAt: number;
}

export const PostNotification = ({
  item,
  unread,
  inline,
  dataUpdatedAt,
}: Props) => {
  const { preferences, contentFilter } = useContentFilter();

  if (preferences.data) {
    const filter = contentFilter(item.post?.labels);

    if (filter?.visibility === "hide") return null;

    if (inline) {
      if (filter) return null;

      if (!AppBskyFeedPost.isRecord(item.post.record)) return null;
      assert(AppBskyFeedPost.validateRecord(item.post.record));

      return (
        <View className="mt-0.5 flex-1">
          {item.post.record.text && (
            <Text className="text-neutral-500 dark:text-neutral-400">
              <RichText
                text={item.post.record.text}
                facets={item.post.record.facets}
                size="sm"
              />
            </Text>
          )}
          {item.post.embed && AppBskyEmbedImages.isView(item.post.embed) && (
            <Embed
              uri={item.post.uri}
              content={item.post.embed}
              truncate
              depth={1}
              isNotification
            />
          )}
        </View>
      );
    }

    return (
      <FeedPost
        filter={filter}
        item={item}
        inlineParent
        unread={unread}
        dataUpdatedAt={dataUpdatedAt}
      />
    );
  }

  if (inline) return <View className="h-10" />;
  return (
    <NotificationItem unread={unread}>
      <View className="h-32" />
    </NotificationItem>
  );
};
