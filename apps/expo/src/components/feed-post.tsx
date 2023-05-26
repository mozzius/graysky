import { useEffect, useState } from "react";
import {
  Button,
  I18nManager,
  TouchableWithoutFeedback as RNTouchableWithoutFeedback,
  Text,
  View,
} from "react-native";
import {
  TouchableOpacity,
  TouchableWithoutFeedback,
} from "react-native-gesture-handler";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  Repeat,
  User,
} from "lucide-react-native";
import { z } from "zod";

// import { type Posts } from "../app/(tabs)/(skyline,search,notifications,self)/profile/[handle]/post/[id]";
import { useAuthedAgent } from "../lib/agent";
import {
  useColorScheme,
  useHandleRepost,
  useLike,
  usePostViewOptions,
  useRepost,
} from "../lib/hooks";
import { assert } from "../lib/utils/assert";
import { cx } from "../lib/utils/cx";
import { timeSince } from "../lib/utils/time";
import { useComposer } from "./composer";
import { Embed } from "./embed";
import { RichText } from "./rich-text";

interface Props {
  item: AppBskyFeedDefs.FeedViewPost;
  isReply?: boolean;
  hasReply?: boolean;
  unread?: boolean;
  inlineParent?: boolean;
  dataUpdatedAt: number;
}

export const FeedPost = ({
  item,
  isReply = false,
  hasReply = false,
  unread,
  inlineParent,
  dataUpdatedAt,
}: Props) => {
  const startHidden = Boolean(
    item.post.author.viewer?.blocking || !!item.post.author.viewer?.blocked,
  );
  const [hidden, setHidden] = useState(startHidden);
  const { liked, likeCount, toggleLike } = useLike(item.post, dataUpdatedAt);
  const { reposted, repostCount, toggleRepost } = useRepost(
    item.post,
    dataUpdatedAt,
  );
  const replyCount = item.post.replyCount;
  const composer = useComposer();
  const handleRepost = useHandleRepost(
    item.post,
    reposted,
    toggleRepost.mutate,
  );
  const handleMore = usePostViewOptions(item.post);
  const router = useRouter();

  const postAuthorDisplayName = item.post.author.displayName;
  const postAuthorHandle = item.post.author.handle;

  const { colorScheme } = useColorScheme();
  const buttonColor = colorScheme === "light" ? "#1C1C1E" : "#FFF";

  const profileHref = `/profile/${postAuthorHandle}`;
  const postHref = `${profileHref}/post/${item.post.uri.split("/").pop()}`;

  useEffect(() => {
    setHidden(startHidden);
  }, [item.post.cid, startHidden]);

  // IDEA: precache main post of thread
  // useEffect(() => {
  //   queryClient.setQueryData(postHref.split("/"), {
  //     posts: [
  //       {
  //         hasParent: false,
  //         hasReply: false,
  //         post: item.post,
  //         primary: true,
  //       },
  //     ],
  //     index: 0,
  //     main: item.post,
  //   } satisfies {
  //     posts: Posts[];
  //     index: number;
  //     main: AppBskyFeedDefs.PostView;
  //   });
  // }, [item.post, postHref]);

  if (!AppBskyFeedPost.isRecord(item.post.record)) {
    return null;
  }

  assert(AppBskyFeedPost.validateRecord(item.post.record));

  const displayInlineParent = inlineParent || !!item.reason;

  const timeSincePost = timeSince(new Date(item.post.indexedAt));

  if (hidden) {
    return (
      <View
        className={cx(
          "bg-white p-2 pl-16 text-black dark:bg-black dark:text-white",
          isReply && !item.reason && "pt-0",
          !hasReply && "border-b border-neutral-200 dark:border-neutral-600",
          unread && "border-blue-200 bg-blue-50 dark:border-neutral-800",
        )}
      >
        <View className="flex-1 pb-2.5 pl-1 pr-2">
          <View className="flex-row items-center justify-between rounded-sm border border-neutral-300 bg-neutral-50 px-2 dark:border-neutral-700 dark:bg-neutral-950">
            <Text className="my-1 max-w-[75%] font-semibold dark:text-neutral-50">
              This post is from someone you have{" "}
              {item.post.author.viewer?.blocking ? "blocked" : "muted"}.
            </Text>
            <Button title="Show" onPress={() => setHidden(false)} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View
      className={cx(
        "bg-white px-2 pt-2 text-black dark:bg-black dark:text-white",
        isReply && !item.reason && "pt-0",
        !hasReply && "border-b border-neutral-200 dark:border-neutral-800",
        unread && "border-blue-200 bg-blue-50 dark:bg-neutral-800",
      )}
    >
      <Reason item={item} />
      <View className="flex-1 flex-row">
        {/* left col */}
        <View
          className="flex flex-col items-center px-2"
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        >
          <View>
            <Link href={profileHref} asChild>
              <TouchableWithoutFeedback>
                {item.post.author.avatar ? (
                  <Image
                    recyclingKey={item.post.author.did}
                    source={{ uri: item.post.author.avatar }}
                    alt={postAuthorHandle}
                    className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800"
                  />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                    <User size={32} color={buttonColor} />
                  </View>
                )}
              </TouchableWithoutFeedback>
            </Link>
          </View>
          <View className="flex-1">
            <Link href={postHref} asChild>
              <TouchableWithoutFeedback className="w-full grow items-center px-5">
                <View
                  className={cx(
                    "w-0.5 grow",
                    hasReply && "bg-neutral-200 dark:bg-neutral-800",
                  )}
                />
              </TouchableWithoutFeedback>
            </Link>
          </View>
        </View>
        {/* right col */}
        <View className="flex-1 pb-2.5 pl-1 pr-2">
          <View className="flex-row items-center">
            <Link
              href={profileHref}
              accessibilityLabel={
                isReply
                  ? `Reply by ${postAuthorDisplayName} @${postAuthorHandle} ${timeSincePost.accessible}`
                  : `${postAuthorDisplayName} @${postAuthorHandle} ${timeSincePost.accessible}`
              }
              accessibilityHint="Opens profile"
              asChild
            >
              <TouchableWithoutFeedback
                className={I18nManager.isRTL ? "flex-row-reverse" : "flex-row"}
              >
                <Text
                  numberOfLines={1}
                  className={cx(
                    "max-w-full text-base",
                    I18nManager.isRTL ? "pl-20" : "pr-20",
                  )}
                >
                  <Text className="font-semibold dark:text-neutral-50">
                    {postAuthorDisplayName}
                  </Text>
                  <Text className="text-neutral-500 dark:text-neutral-400">
                    {` @${postAuthorHandle}`}
                  </Text>
                </Text>
                {/* get age of post - e.g. 5m */}
                <Text
                  className={cx(
                    "relative ml-1 text-base text-neutral-500 dark:text-neutral-400",
                    I18nManager.isRTL ? "-right-20" : "-left-20",
                  )}
                >
                  {!I18nManager.isRTL && " · "}
                  {timeSincePost.visible}
                  {I18nManager.isRTL && " · "}
                </Text>
              </TouchableWithoutFeedback>
            </Link>
          </View>
          {/* inline "replying to so-and-so" */}
          {displayInlineParent &&
            (item.reply
              ? (() => {
                  // use zod to parse the parent post
                  // since all we want is author + uri
                  // don't actually care what specific kind of post it is
                  const parse = z
                    .object({
                      author: z.object({
                        handle: z.string(),
                        displayName: z.string().optional(),
                      }),
                      uri: z.string(),
                    })
                    .safeParse(item.reply.parent);

                  if (parse.success) {
                    return (
                      <Link
                        href={`/profile/${
                          parse.data.author.handle
                        }/post/${parse.data.uri.split("/").pop()}`}
                        asChild
                        accessibilityHint="Opens parent post"
                      >
                        <TouchableWithoutFeedback className="flex-row items-center">
                          <MessageCircle size={12} color="#737373" />
                          <Text
                            className="ml-1 flex-1 text-neutral-500 dark:text-neutral-400"
                            numberOfLines={1}
                          >
                            replying to{" "}
                            {parse.data.author.displayName ??
                              `@${parse.data.author.handle}`}
                          </Text>
                        </TouchableWithoutFeedback>
                      </Link>
                    );
                  } else return null;
                })()
              : !!item.post.record.reply && (
                  <ReplyParentAuthor uri={item.post.record.reply.parent.uri} />
                ))}
          {/* text content */}
          {item.post.record.text &&
            /* bug - can't press links that are children of a gesture handler component */
            (item.post.record.facets?.length ? (
              <RNTouchableWithoutFeedback
                className="my-0.5"
                accessibilityHint="Opens post details"
                onPress={() => router.push(postHref)}
              >
                <View>
                  <RichText
                    text={item.post.record.text}
                    facets={item.post.record.facets}
                  />
                </View>
              </RNTouchableWithoutFeedback>
            ) : (
              <TouchableWithoutFeedback
                className="my-0.5"
                onPress={() => router.push(postHref)}
              >
                <RichText text={item.post.record.text} />
              </TouchableWithoutFeedback>
            ))}
          {/* embeds */}
          {item.post.embed && (
            <Embed uri={item.post.uri} content={item.post.embed} />
          )}
          {/* actions */}
          <View className="mt-2.5 flex-row justify-between pr-6">
            <TouchableOpacity
              accessibilityLabel={`Reply, ${replyCount} repl${
                replyCount !== 1 ? "ies" : "y"
              }`}
              accessibilityRole="button"
              onPress={() =>
                composer.open({
                  parent: item.post,
                  root:
                    item.reply?.root &&
                    AppBskyFeedDefs.isPostView(item.reply.root)
                      ? item.reply.root
                      : item.post,
                })
              }
              className="flex-row items-center gap-2 tabular-nums"
              hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
            >
              <MessageSquare size={16} color={buttonColor} />
              <Text style={{ color: buttonColor }}>{replyCount}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={`Repost, ${repostCount} repost${
                repostCount !== 1 ? "s" : ""
              }`}
              accessibilityRole="button"
              disabled={toggleRepost.isLoading}
              onPress={handleRepost}
              hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
              className="flex-row items-center gap-2 tabular-nums"
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
              accessibilityLabel={`Like, ${likeCount} like${
                likeCount !== 1 ? "s" : ""
              }`}
              accessibilityRole="button"
              disabled={toggleLike.isLoading}
              onPress={() => toggleLike.mutate()}
              hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
              className="flex-row items-center gap-2 tabular-nums"
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
            <TouchableOpacity
              accessibilityLabel="More options"
              accessibilityRole="button"
              onPress={handleMore}
              hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
            >
              <MoreHorizontal size={16} color={buttonColor} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const Reason = ({ item }: Pick<Props, "item">) => {
  const { colorScheme } = useColorScheme();
  const buttonColor = colorScheme === "light" ? "#1C1C1E" : "#FFF";

  if (!AppBskyFeedDefs.isReasonRepost(item.reason)) return null;
  assert(AppBskyFeedDefs.validateReasonRepost(item.reason));

  return (
    <View className="mb-1 ml-12 flex-1">
      <Link
        href={`/profile/${item.reason.by.handle}`}
        asChild
        accessibilityHint="Opens profile"
      >
        <TouchableOpacity>
          <View className="flex-1 flex-row items-center">
            <Repeat color={buttonColor} size={12} />
            <Text
              className="ml-2 flex-1 text-sm dark:text-neutral-50"
              numberOfLines={1}
            >
              Reposted by {item.reason.by.displayName ?? item.reason.by.handle}
            </Text>
          </View>
        </TouchableOpacity>
      </Link>
    </View>
  );
};

const ReplyParentAuthor = ({ uri }: { uri: string }) => {
  const { colorScheme } = useColorScheme();
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
        <MessageCircle size={12} color={circleColor} />
        <Text className="ml-1 text-neutral-500" numberOfLines={1}>
          replying to{isLoading ? "..." : " unknown"}
        </Text>
      </View>
    );
  return (
    <Link
      href={`/profile/${data.author.handle}/post/${data.uri.split("/").pop()}`}
      asChild
      accessibilityHint="Opens parent post"
    >
      <TouchableWithoutFeedback className="flex-row items-center">
        <MessageCircle size={12} color={circleColor} />
        <Text
          className="ml-1 flex-1 text-neutral-500 dark:text-neutral-400"
          numberOfLines={1}
        >
          replying to {data.author.displayName ?? `@${data.author.handle}`}
        </Text>
      </TouchableWithoutFeedback>
    </Link>
  );
};
