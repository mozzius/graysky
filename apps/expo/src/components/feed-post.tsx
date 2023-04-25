import { Image, Pressable, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  MessageSquare,
  Repeat,
  User,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useAuthedAgent } from "../lib/agent";
import { useLike, useRepost } from "../lib/hooks";
import { assert } from "../lib/utils/assert";
import { cx } from "../lib/utils/cx";
import { timeSince } from "../lib/utils/time";
import { Embed } from "./embed";
import { RichText } from "./rich-text";

interface Props {
  item: AppBskyFeedDefs.FeedViewPost;
  isReply?: boolean;
  hasReply?: boolean;
  unread?: boolean;
  inlineParent?: boolean;
}

export const FeedPost = ({
  item,
  isReply = false,
  hasReply = false,
  unread,
  inlineParent,
}: Props) => {
  const { liked, likeCount, toggleLike } = useLike(item.post);
  const { reposted, repostCount, toggleRepost } = useRepost(item.post);

  const profileHref = `/profile/${item.post.author.handle}`;

  const postHref = `${profileHref}/post/${item.post.uri.split("/").pop()}`;

  if (!AppBskyFeedPost.isRecord(item.post.record)) {
    return null;
  }

  assert(AppBskyFeedPost.validateRecord(item.post.record));

  const displayInlineParent = inlineParent || !!item.reason;

  const { colorScheme, toggleColorScheme } = useColorScheme();

  const buttonColor = colorScheme === "light" ? "#1C1C1E" : "#FFF";

  return (
    <View
      className={cx(
        "bg-white px-2 pt-2 dark:bg-black",
        isReply && !item.reason && "pt-0",
        !hasReply && "border-b border-neutral-200 dark:border-neutral-800",
        unread && "border-blue-200 bg-blue-50 dark:bg-blue-950",
      )}
    >
      <Reason item={item} />
      <View className="flex-1 flex-row">
        {/* left col */}
        <View className="flex flex-col items-center px-2">
          <Link href={profileHref} asChild>
            <Pressable>
              {item.post.author.avatar ? (
                <Image
                  source={{ uri: item.post.author.avatar }}
                  alt={item.post.author.handle}
                  className="h-12 w-12 rounded-full"
                />
              ) : (
                <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                  <User size={32} color={buttonColor} />
                </View>
              )}
            </Pressable>
          </Link>
          <Link href={postHref} asChild>
            <Pressable className="w-full grow items-center">
              {hasReply && (
                <View className="w-1 grow bg-neutral-200 dark:bg-neutral-800" />
              )}
            </Pressable>
          </Link>
        </View>
        {/* right col */}
        <View className="flex-1 pb-2.5 pl-1 pr-2">
          <Link href={profileHref} asChild>
            <Pressable className="flex-row items-center">
              <Text numberOfLines={1} className="max-w-[85%] text-base">
                <Text className="font-semibold text-neutral-500 dark:text-neutral-50">
                  {item.post.author.displayName}
                </Text>
                <Text className="text-neutral-500 dark:text-neutral-50">
                  {` @${item.post.author.handle}`}
                </Text>
              </Text>
              {/* get age of post - e.g. 5m */}
              <Text className="text-base text-neutral-500 dark:text-neutral-50">
                {" · "}
                {timeSince(new Date(item.post.indexedAt))}
              </Text>
            </Pressable>
          </Link>
          {/* inline "replying to so-and-so" */}
          {displayInlineParent &&
            (!!item.reply ? (
              <Link
                href={`/profile/${
                  item.reply.parent.author.handle
                }/post/${item.reply.parent.uri.split("/").pop()}`}
                asChild
              >
                <Pressable className="flex-row items-center">
                  <MessageCircle size={12} color="#737373" />
                  <Text className="ml-1 text-neutral-500 dark:text-neutral-50">
                    replying to{" "}
                    {item.reply.parent.author.displayName ??
                      `@${item.reply.parent.author.handle}`}
                  </Text>
                </Pressable>
              </Link>
            ) : (
              !!item.post.record.reply && (
                <ReplyParentAuthor uri={item.post.record.reply!.parent.uri} />
              )
            ))}
          {/* text content */}
          <Link href={postHref} asChild>
            <Pressable className="my-0.5">
              <RichText
                text={item.post.record.text}
                facets={item.post.record.facets}
              />
            </Pressable>
          </Link>
          {/* embeds */}
          {item.post.embed && (
            <Embed uri={item.post.uri} content={item.post.embed} />
          )}
          {/* actions */}
          <View className="mt-2 flex-row justify-between">
            <TouchableOpacity className="flex-row items-center gap-2">
              <MessageSquare size={16} color={buttonColor} />
              <Text>{item.post.replyCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              disabled={toggleRepost.isLoading}
              onPress={() => toggleRepost.mutate()}
              hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
              className="flex-row items-center gap-2"
            >
              <Repeat size={16} color={reposted ? "#2563eb" : buttonColor} />
              <Text
                style={{
                  color: reposted ? "#2563eb" : buttonColor,
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
            <View className="w-8" />
          </View>
        </View>
      </View>
    </View>
  );
};

const Reason = ({ item }: Props) => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const buttonColor = colorScheme === "light" ? "#1C1C1E" : "#FFF";

  if (!AppBskyFeedDefs.isReasonRepost(item.reason)) return null;
  assert(AppBskyFeedDefs.validateReasonRepost(item.reason));

  return (
    <Link href={`/profile/${item.reason.by.handle}`} asChild>
      <TouchableOpacity className="mb-1 ml-12 flex-1 flex-row items-center">
        <Repeat color={buttonColor} size={12} />
        <Text
          className="ml-2 flex-1 text-sm text-neutral-500 dark:text-neutral-50"
          numberOfLines={1}
        >
          Reposted by {item.reason.by.displayName ?? item.reason.by.handle}
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

const ReplyParentAuthor = ({ uri }: { uri: string }) => {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  const circleColor = colorScheme === "light" ? "#737373" : "#D4D4D4";

  const agent = useAuthedAgent();
  const { data, isLoading } = useQuery({
    queryKey: ["post", uri],
    queryFn: async () => {
      const thread = await agent.getPostThread({
        uri,
        depth: 0,
      });
      if (AppBskyFeedDefs.isThreadViewPost(thread.data.thread)) {
        assert(AppBskyFeedDefs.validateThreadViewPost(thread.data.thread));
        return thread.data.thread.post;
      }
      throw new Error("invalid post");
    },
  });
  if (!data)
    return (
      <View className="flex-row items-center">
        <MessageCircle size={12} color="#737373" />
        <Text className="ml-1 text-neutral-500">
          replying to{isLoading ? "..." : " unknown"}
        </Text>
      </View>
    );
  return (
    <Link
      href={`/profile/${data.author.handle}/post/${data.uri.split("/").pop()}`}
      asChild
    >
      <Pressable className="flex-row items-center">
        <MessageCircle size={12} color={circleColor} />
        <Text className="ml-1 text-neutral-500 dark:text-neutral-300">
          replying to {data.author.displayName ?? `@${data.author.handle}`}
        </Text>
      </Pressable>
    </Link>
  );
};
