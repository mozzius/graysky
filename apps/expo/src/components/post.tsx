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
import { useColorScheme } from "nativewind";

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
  dataUpdatedAt: number;
}

export const Post = ({ post, hasParent, root, dataUpdatedAt }: Props) => {
  const { liked, likeCount, toggleLike } = useLike(post, dataUpdatedAt);
  const { reposted, repostCount, toggleRepost } = useRepost(
    post,
    dataUpdatedAt,
  );
  const replyCount = post.replyCount;
  const handleRepost = useHandleRepost(post, reposted, toggleRepost.mutate);
  const handleMore = usePostViewOptions(post);
  const composer = useComposer();
  const { colorScheme } = useColorScheme();
  const buttonColor = colorScheme === "light" ? "#1C1C1E" : "#FFF";

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
        "border-b border-neutral-200 bg-white px-4 pb-4 pt-3 dark:border-neutral-600 dark:bg-black",
        hasParent && "border-t",
      )}
    >
      <View className="mb-2 flex-row">
        <Link href={profileHref} asChild>
          <TouchableOpacity>
            {post.author.avatar ? (
              <Image
                source={{ uri: post.author.avatar }}
                alt=""
                className="h-12 w-12 rounded-full"
              />
            ) : (
              <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900">
                <User size={32} color={buttonColor} />
              </View>
            )}
          </TouchableOpacity>
        </Link>
        <View className="justify ml-3 flex-1 flex-row items-center">
          <Link
            href={profileHref}
            accessibilityHint="Opens profile"
            accessibilityLabel={`${postAuthorDisplayName} @${postAuthorHandle}`}
            asChild
          >
            <TouchableOpacity className="flex-1">
              <Text
                numberOfLines={1}
                className="text-base font-semibold dark:text-neutral-50"
              >
                {postAuthorDisplayName}
              </Text>
              <Text
                numberOfLines={1}
                className="text-base leading-5 text-neutral-500 dark:text-neutral-400"
              >
                @{postAuthorHandle}
              </Text>
            </TouchableOpacity>
          </Link>
          <TouchableOpacity
            accessibilityLabel="More options"
            accessibilityRole="button"
            onPress={handleMore}
            className="p-2"
          >
            <MoreVertical size={18} color={buttonColor} />
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
          <MessageSquare size={18} color={buttonColor} />
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
          <Repeat size={18} color={reposted ? "#2563eb" : buttonColor} />
          <Text
            style={{
              color: reposted ? "#2563eb" : buttonColor,
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
            color={liked ? "#dc2626" : buttonColor}
          />
          <Text
            style={{
              color: liked ? "#dc2626" : buttonColor,
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
