import { useCallback, useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { AppBskyFeedPost, type AppBskyFeedDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { Heart, MessageSquare, Repeat } from "lucide-react-native";

import { useHandleRepost, useLike, useRepost } from "../lib/hooks";
import { locale } from "../lib/locale";
import { assert } from "../lib/utils/assert";
import { cx } from "../lib/utils/cx";
import { useComposer } from "./composer";
import { Embed } from "./embed";
import { PostAvatar } from "./post-avatar";
import { PostContextMenu } from "./post-context-menu";
import { RichText } from "./rich-text";
import { Translation } from "./translation";

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
  const theme = useTheme();
  const composer = useComposer();
  const [rerenderer, rerender] = useState(0);

  const onChangeStatus = useCallback(() => {
    rerender((prev) => prev + 1);
  }, []);

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
        "border-b px-4 pb-4 pt-3",
        hasParent && "border-t",
        theme.dark
          ? "border-neutral-800 bg-black"
          : "border-neutral-200 bg-white",
      )}
    >
      <View className="mb-2 flex-row">
        <PostAvatar profile={post.author} />
        <View className="justify ml-3 flex-1 flex-row items-center">
          <Link
            href={profileHref}
            accessibilityHint="Opens profile"
            accessibilityLabel={`${postAuthorDisplayName} @${postAuthorHandle}`}
            asChild
          >
            <TouchableOpacity className="flex-1">
              <Text
                style={{ color: theme.colors.text }}
                numberOfLines={1}
                className="text-base font-semibold"
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
          <PostContextMenu post={post} />
        </View>
      </View>
      {/* text content */}
      {post.record.text && (
        <>
          <RichText
            text={post.record.text}
            facets={post.record.facets}
            size="lg"
          />
          {post.language && post.language !== locale.languageCode && (
            <View className="mt-1">
              <Translation
                uri={post.uri}
                text={post.record.text}
                onChangeStatus={onChangeStatus}
              />
            </View>
          )}
        </>
      )}
      {/* embeds */}
      {post.embed && (
        <Embed
          uri={post.uri}
          content={post.embed}
          truncate={false}
          key={rerenderer}
          postIndex={Infinity}
        />
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
          <MessageSquare size={18} color={theme.colors.text} />
          <Text style={{ color: theme.colors.text }} className="tabular-nums">
            {replyCount}
          </Text>
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
          <Repeat size={18} color={reposted ? "#2563eb" : theme.colors.text} />
          <Text
            style={{
              color: reposted ? "#2563eb" : theme.colors.text,
            }}
            className="tabular-nums"
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
            color={liked ? "#dc2626" : theme.colors.text}
          />
          <Text
            style={{
              color: liked ? "#dc2626" : theme.colors.text,
            }}
            className="tabular-nums"
          >
            {likeCount}
          </Text>
        </TouchableOpacity>
        <Text className="text-sm text-neutral-500 dark:text-neutral-400">
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
