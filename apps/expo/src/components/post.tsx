import { Image, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { AppBskyFeedPost, type AppBskyFeedDefs } from "@atproto/api";
import { Heart, MessageSquare, Repeat, User } from "lucide-react-native";

import { useLike, useRepost } from "../lib/hooks";
import { assert } from "../lib/utils/assert";
import { cx } from "../lib/utils/cx";
import { timeSince } from "../lib/utils/time";
import { useComposer } from "./composer";
import { Embed } from "./embed";
import { RichText } from "./rich-text";

interface Props {
  post: AppBskyFeedDefs.PostView;
  hasParent?: boolean;
  root: AppBskyFeedDefs.PostView;
}

export const Post = ({ post, hasParent, root }: Props) => {
  const { liked, likeCount, toggleLike } = useLike(post);
  const { reposted, repostCount, toggleRepost } = useRepost(post);
  const composer = useComposer();

  const profileHref = `/profile/${post.author.handle}`;

  if (!AppBskyFeedPost.isRecord(post.record)) {
    return null;
  }

  assert(AppBskyFeedPost.validateRecord(post.record));

  return (
    <View
      className={cx(
        "border-b border-neutral-200 bg-white px-4 pb-4 pt-3",
        hasParent && "border-t",
      )}
    >
      <Link href={profileHref} asChild>
        <TouchableOpacity className="mb-2 flex-row">
          {post.author.avatar ? (
            <Image
              source={{ uri: post.author.avatar }}
              alt={post.author.handle}
              className="h-12 w-12 rounded-full"
            />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <User size={32} color="#1C1C1E" />
            </View>
          )}
          <View className="ml-3 flex-1 justify-center">
            <View className="flex-row">
              <Text
                numberOfLines={1}
                className="max-w-[85%] text-base font-semibold"
              >
                {post.author.displayName}
              </Text>
              {/* get age of post - e.g. 5m */}
              <Text className="text-base text-neutral-500">
                {" "}
                · {timeSince(new Date(post.indexedAt))}
              </Text>
            </View>
            <Text className="text-base leading-5 text-neutral-500">
              @{post.author.handle}
            </Text>
          </View>
        </TouchableOpacity>
      </Link>
      {/* text content */}
      {post.record.text && (
        <RichText
          text={post.record.text}
          facets={post.record.facets}
          size="lg"
        />
      )}
      {/* embeds */}
      {post.embed && (
        <Embed uri={post.uri} content={post.embed} truncate={false} />
      )}
      {/* actions */}
      <View className="mt-4 flex-row justify-between">
        <TouchableOpacity
          onPress={() =>
            composer.open({
              parent: post,
              root,
            })
          }
          className="flex-row items-center gap-2"
        >
          <MessageSquare size={16} color="#1C1C1E" />
          <Text>{post.replyCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={toggleRepost.isLoading}
          onPress={() => toggleRepost.mutate()}
          hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
          className="flex-row items-center gap-2"
        >
          <Repeat size={16} color={reposted ? "#2563eb" : "#1C1C1E"} />
          <Text
            style={{
              color: reposted ? "#2563eb" : "#1C1C1E",
            }}
          >
            {repostCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          disabled={toggleLike.isLoading}
          onPress={() => toggleLike.mutate()}
          hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
          className="flex-row items-center gap-2"
        >
          <Heart
            size={16}
            fill={liked ? "#dc2626" : "transparent"}
            color={liked ? "#dc2626" : "#1C1C1E"}
          />
          <Text
            style={{
              color: liked ? "#dc2626" : "#1C1C1E",
            }}
          >
            {likeCount}
          </Text>
        </TouchableOpacity>
        <View className="w-8" />
      </View>
    </View>
  );
};
