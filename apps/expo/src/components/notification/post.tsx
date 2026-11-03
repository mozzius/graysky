import { View } from "react-native";
import { app } from "@bsky/sdk/lexicons";

import { useContentFilter } from "~/lib/hooks/preferences";
import { isType } from "~/lib/utils/types";
import { Embed } from "../embed";
import { FeedPost } from "../feed-post";
import { RichText } from "../rich-text";
import { NotificationItem } from "./item";

interface Props {
  item: app.bsky.feed.defs.ThreadViewPost;
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

      if (!isType(app.bsky.feed.post, item.post.record)) return null;

      const embedImage =
        item.post.embed && isType(app.bsky.embed.images.view, item.post.embed)
          ? item.post.embed
          : isType(app.bsky.embed.recordWithMedia.view, item.post.embed) &&
            isType(app.bsky.embed.images.view, item.post.embed.media) &&
            item.post.embed.media;

      return (
        <View className="mt-0.5 flex-1">
          {item.post.record.text && (
            <RichText
              className="text-neutral-500 dark:text-neutral-400"
              text={item.post.record.text}
              facets={item.post.record.facets}
              size="sm"
            />
          )}
          {embedImage && (
            <Embed
              uri={item.post.uri}
              content={embedImage}
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
        item={{ post: item.post }}
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
