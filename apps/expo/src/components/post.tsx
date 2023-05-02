import { Image, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { AppBskyFeedPost, type AppBskyFeedDefs } from "@atproto/api";
import {
  Heart,
  MessageSquare,
  MoreVertical,
  Repeat,
  User,
} from "lucide-react-native";

import {
  useHandleRepost,
  useLike,
  usePostViewOptions,
  useRepost,
} from "../lib/hooks";
import { locale } from "../lib/locale";
import { assert } from "../lib/utils/assert";
import { cx } from "../lib/utils/cx";
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
  const replyCount = post.replyCount;
  const handleRepost = useHandleRepost(post, reposted, toggleRepost.mutate);
  const handleMore = usePostViewOptions(post);
  const composer = useComposer();

  const postAuthorDisplayName = post.author.displayName;
  const postAuthorHandle = post.author.handle;
  const profileHref = `/profile/${postAuthorHandle}`;

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
      <View className="mb-2 flex-row">
        {post.author.avatar ? (
          <Image
            source={{ uri: post.author.avatar }}
            alt=""
            className="h-12 w-12 rounded-full"
          />
        ) : (
          <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
            <User size={32} color="#1C1C1E" />
          </View>
        )}
        <View className="justify ml-3 flex-1 flex-row items-center">
          <Link href={profileHref} asChild accessibilityHint="Opens profile">
            <TouchableOpacity className="flex-1">
              <Text
                numberOfLines={1}
                className="max-w-[85%] text-base font-semibold"
              >
                {postAuthorDisplayName}
              </Text>
              <Text className="text-base leading-5 text-neutral-500">
                @{postAuthorHandle}
              </Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity
            accessibilityLabel="More options"
            accessibilityRole="button"
            onPress={handleMore}
          >
            <MoreVertical size={18} color="#1C1C1E" />
          </TouchableOpacity>
        </View>
      </View>
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
      <View className="mt-4 flex-row items-center justify-between">
        <TouchableOpacity
          accessibilityLabel={`Reply, ${replyCount} repl${
            replyCount !== 1 ? "ies" : "y"
          }`}
          accessibilityRole="button"
          className="flex-row items-center gap-2 p-1"
          onPress={() =>
            composer.open({
              parent: post,
              root,
            })
          }
        >
          <MessageSquare size={18} color="#1C1C1E" />
          <Text>{replyCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={`Repost, ${repostCount} repost${
            repostCount !== 1 ? "s" : ""
          }`}
          accessibilityRole="button"
          className="flex-row items-center gap-2 p-1"
          disabled={toggleRepost.isLoading}
          onPress={handleRepost}
          hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
        >
          <Repeat size={18} color={reposted ? "#2563eb" : "#1C1C1E"} />
          <Text
            style={{
              color: reposted ? "#2563eb" : "#1C1C1E",
            }}
          >
            {repostCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityLabel={`Like, ${likeCount} like${
            likeCount !== 1 ? "s" : ""
          }`}
          accessibilityRole="button"
          className="flex-row items-center gap-2 p-1"
          disabled={toggleLike.isLoading}
          onPress={() => toggleLike.mutate()}
          hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
        >
          <Heart
            size={18}
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
        <Text className="text-sm text-neutral-400">
          {new Intl.DateTimeFormat(locale.languageTag, {
            timeStyle: "short",
            dateStyle: "short",
          })
            .format(new Date(post.record.createdAt))
            .split(",")
            .reverse()
            .join(" · ")}
        </Text>
      </View>
    </View>
  );
};
