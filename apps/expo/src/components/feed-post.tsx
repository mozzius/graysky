import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  findNodeHandle,
  I18nManager,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Link } from "expo-router";
import { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  HeartIcon,
  MessageCircleIcon,
  MessageSquareIcon,
  RepeatIcon,
} from "lucide-react-native";
import { z } from "zod";

import { type Posts } from "~/app/(tabs)/(feeds,search,notifications,self)/profile/[handle]/post/[id]";
import { useAgent } from "~/lib/agent";
import { useHandleRepost, useLike, useRepost } from "~/lib/hooks";
import { useComposer } from "~/lib/hooks/composer";
import { useAppPreferences, type FilterResult } from "~/lib/hooks/preferences";
import { assert } from "~/lib/utils/assert";
import { cx } from "~/lib/utils/cx";
import { isPostInLanguage } from "~/lib/utils/locale/helpers";
import { timeSince } from "~/lib/utils/time";
import { Embed } from "./embed";
import { PostAvatar } from "./post-avatar";
import { PostContextMenu } from "./post-context-menu";
import { RichText } from "./rich-text";
import { Text } from "./text";
import { Translation } from "./translation";

interface Props {
  item: AppBskyFeedDefs.FeedViewPost;
  isReply?: boolean;
  hasReply?: boolean;
  unread?: boolean;
  inlineParent?: boolean;
  dataUpdatedAt: number;
  filter: FilterResult;
  hideActions?: boolean;
  hideEmbed?: boolean;
  embedDepth?: number;
  numberOfLines?: number;
  avatarSize?: "normal" | "reduced";
  background?: "transparent";
}

const FeedPostInner = ({
  item,
  isReply = false,
  hasReply = false,
  unread,
  inlineParent,
  dataUpdatedAt,
  filter,
  hideActions,
  hideEmbed,
  embedDepth,
  numberOfLines,
  avatarSize = "normal",
  background,
}: Props) => {
  const showWarning = Boolean(
    !!item.post.author.viewer?.blocking ||
      !!item.post.author.viewer?.blocked ||
      !!filter,
  );
  const [hidden, setHidden] = useState(showWarning);
  const { liked, likeCount, toggleLike } = useLike(item.post, dataUpdatedAt);
  const { reposted, repostCount, toggleRepost } = useRepost(
    item.post,
    dataUpdatedAt,
  );
  const replyCount = item.post.replyCount;
  const composer = useComposer();
  const anchorRef = useRef<TouchableOpacity>(null!);

  const handleRepost = useHandleRepost(
    item.post,
    reposted,
    toggleRepost.mutate,
    (anchorRef.current && findNodeHandle(anchorRef.current)) ?? undefined,
  );

  const postAuthorDisplayName = item.post.author.displayName;
  const postAuthorHandle = item.post.author.handle;

  const theme = useTheme();
  const queryClient = useQueryClient();

  const profileHref = `/profile/${postAuthorHandle}`;
  const postHref = `${profileHref}/post/${item.post.uri.split("/").pop()}`;

  useEffect(() => {
    setHidden(showWarning);
  }, [item.post.cid, showWarning]);

  useEffect(() => {
    queryClient.setQueryData(postHref.slice(1).split("/"), (old: unknown) => {
      if (old) {
        return old;
      } else {
        return {
          posts: [
            {
              hasParent: false,
              hasReply: false,
              post: item.post,
              primary: true,
              filter,
              viewable: true,
            },
          ],
          index: 0,
          main: item.post,
        } satisfies {
          posts: Posts[];
          index: number;
          main: AppBskyFeedDefs.PostView;
        };
      }
    });
  }, [item.post, postHref, filter, queryClient]);

  const [{ contentLanguages }] = useAppPreferences();

  const needsTranslation = useMemo(
    () => !isPostInLanguage(item.post, contentLanguages),
    [item.post, contentLanguages],
  );

  if (!AppBskyFeedPost.isRecord(item.post.record)) {
    return null;
  }

  assert(AppBskyFeedPost.validateRecord(item.post.record));

  const displayInlineParent = inlineParent || !!item.reason;

  const timeSincePost = timeSince(new Date(item.post.indexedAt));

  const hiddenContent = showWarning && (
    <View
      className={cx(
        "my-2 max-w-xl flex-row items-center justify-between rounded border px-2",
        theme.dark
          ? "border-neutral-700 bg-neutral-950"
          : "border-neutral-300 bg-neutral-50",
      )}
    >
      <Text className="my-1 max-w-[75%] font-semibold">
        {filter
          ? filter.message
          : `This post is from someone you have ${
              item.post.author.viewer?.blocking ? "blocked" : "muted"
            }.`}
      </Text>
      <Button
        title={hidden ? "Show" : "Hide"}
        onPress={() => setHidden((h) => !h)}
      />
    </View>
  );

  return (
    <View
      className={cx(
        "flex-1 px-2 pt-2",
        isReply && !item.reason && "pt-0",
        !hasReply && "border-b",
        unread
          ? theme.dark
            ? "border-slate-600 bg-slate-800"
            : "border-blue-200 bg-blue-50"
          : theme.dark
          ? "bg-black"
          : "bg-white",
        background === "transparent" && "bg-transparent",
      )}
      style={unread ? undefined : { borderBottomColor: theme.colors.border }}
    >
      <Reason item={item} />
      <View className="flex-1 flex-row">
        {/* left col */}
        <View
          className="items-center px-2"
          accessibilityElementsHidden={true}
          importantForAccessibility="no-hide-descendants"
        >
          <PostAvatar profile={item.post.author} avatarSize={avatarSize} />
          <Link href={postHref} asChild>
            <TouchableWithoutFeedback>
              <View
                className={cx("flex-1 items-center", {
                  "w-10": avatarSize === "reduced",
                  "w-12": avatarSize === "normal",
                })}
              >
                <View
                  className="w-0.5 flex-1"
                  style={{
                    backgroundColor: hasReply ? theme.colors.border : undefined,
                  }}
                />
              </View>
            </TouchableWithoutFeedback>
          </Link>
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
              <TouchableWithoutFeedback>
                <View
                  className={
                    I18nManager.isRTL ? "flex-row-reverse" : "flex-row"
                  }
                >
                  <Text
                    numberOfLines={1}
                    className={cx(
                      "max-w-full text-base",
                      I18nManager.isRTL ? "pl-16" : "pr-16",
                    )}
                  >
                    <Text className="font-semibold">
                      {postAuthorDisplayName}
                    </Text>
                    <Text
                      className={
                        theme.dark ? "text-neutral-400" : "text-neutral-500"
                      }
                    >
                      {` @${postAuthorHandle}`}
                    </Text>
                  </Text>
                  {/* get age of post - e.g. 5m */}
                  <Text
                    className={cx(
                      "relative ml-1 text-base",
                      theme.dark ? "text-neutral-400" : "text-neutral-500",
                      I18nManager.isRTL ? "-right-16" : "-left-16",
                    )}
                  >
                    {!I18nManager.isRTL && " · "}
                    {timeSincePost.visible}
                    {I18nManager.isRTL && " · "}
                  </Text>
                </View>
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
                        <TouchableWithoutFeedback>
                          <View className="flex-row items-center">
                            <MessageCircleIcon size={12} color="#737373" />
                            <Text
                              className={cx(
                                "ml-1 flex-1",
                                theme.dark
                                  ? "text-neutral-400"
                                  : "text-neutral-500",
                              )}
                              numberOfLines={1}
                            >
                              replying to{" "}
                              {parse.data.author.displayName ??
                                `@${parse.data.author.handle}`}
                            </Text>
                          </View>
                        </TouchableWithoutFeedback>
                      </Link>
                    );
                  } else return null;
                })()
              : !!item.post.record.reply && (
                  <ReplyParentAuthor uri={item.post.uri} />
                ))}
          {hiddenContent}
          {hidden || (
            <View className="flex-1">
              {/* text content */}
              {item.post.record.text && (
                <>
                  <Link href={postHref} asChild>
                    <TouchableWithoutFeedback accessibilityHint="Opens post details">
                      <View className="my-0.5 flex-1 lg:pr-24">
                        <RichText
                          text={item.post.record.text}
                          facets={item.post.record.facets}
                          numberOfLines={numberOfLines}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </Link>
                  {needsTranslation && (
                    <Translation
                      uri={item.post.uri}
                      text={item.post.record.text}
                    />
                  )}
                </>
              )}
              {/* embeds */}
              {item.post.embed && !hideEmbed && (
                <View className="max-w-xl flex-1">
                  <Embed
                    uri={item.post.uri}
                    content={item.post.embed}
                    depth={embedDepth}
                  />
                </View>
              )}
            </View>
          )}
          {/* display labels for debug */}
          {/* <Text>{(item.post.labels ?? []).map((x) => x.val).join(", ")}</Text> */}
          {/* actions */}
          {!hideActions && (
            <View className="mt-2.5 max-w-sm flex-row justify-between pr-6">
              <TouchableOpacity
                accessibilityLabel={`Reply, ${replyCount} repl${
                  replyCount !== 1 ? "ies" : "y"
                }`}
                accessibilityRole="button"
                onPress={() => composer.reply(item.post)}
                className="flex-row items-center gap-2 tabular-nums"
                hitSlop={{ top: 0, bottom: 20, left: 10, right: 20 }}
              >
                <MessageSquareIcon size={16} color={theme.colors.text} />
                <Text className="tabular-nums">{replyCount}</Text>
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
                ref={anchorRef}
              >
                <RepeatIcon
                  size={16}
                  color={reposted ? "#2563eb" : theme.colors.text}
                />
                <Text
                  style={{
                    color: reposted ? "#2563eb" : theme.colors.text,
                  }}
                  className={cx("tabular-nums", reposted && "font-bold")}
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
                <HeartIcon
                  size={16}
                  fill={liked ? "#dc2626" : "transparent"}
                  color={liked ? "#dc2626" : theme.colors.text}
                />
                <Text
                  style={{
                    color: liked ? "#dc2626" : theme.colors.text,
                  }}
                  className={cx("tabular-nums", liked && "font-bold")}
                >
                  {likeCount}
                </Text>
              </TouchableOpacity>
              <PostContextMenu post={item.post} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const Reason = ({ item }: Pick<Props, "item">) => {
  const theme = useTheme();

  if (!AppBskyFeedDefs.isReasonRepost(item.reason)) return null;
  assert(AppBskyFeedDefs.validateReasonRepost(item.reason));

  return (
    <View className="mb-1 ml-12 flex-1">
      <Link
        href={`/profile/${item.reason.by.handle}`}
        asChild
        accessibilityHint="Opens profile"
      >
        <TouchableWithoutFeedback>
          <View className="flex-1 flex-row items-center">
            <RepeatIcon
              className={theme.dark ? "text-neutral-400" : "text-neutral-500"}
              size={12}
            />
            <Text
              className={cx(
                "ml-2 flex-1 text-sm",
                theme.dark ? "text-neutral-400" : "text-neutral-500",
              )}
              numberOfLines={1}
            >
              Reposted by {item.reason.by.displayName ?? item.reason.by.handle}
            </Text>
          </View>
        </TouchableWithoutFeedback>
      </Link>
    </View>
  );
};

export const FeedPost = memo(FeedPostInner);

const ReplyParentAuthor = ({ uri }: { uri: string }) => {
  const theme = useTheme();
  const circleColor = !theme.dark ? "#737373" : "#D4D4D4";

  const agent = useAgent();
  const { data, isLoading } = useQuery({
    queryKey: ["post", uri],
    queryFn: async () => {
      const thread = await agent.getPostThread({
        uri,
        depth: 0,
        parentHeight: 1,
      });
      return thread.data.thread.parent;
    },
  });

  if (!AppBskyFeedDefs.isThreadViewPost(data)) {
    let text = "replying to a post that couldn't be fetched";
    if (isLoading) {
      text = "replying to...";
    }
    if (AppBskyFeedDefs.isBlockedPost(data)) {
      text = "replying to a blocked user";
    }
    if (AppBskyFeedDefs.isNotFoundPost(data)) {
      text = "replying to a deleted post";
    }

    return (
      <View className="flex-row items-center">
        <MessageCircleIcon size={12} color={circleColor} />
        <Text
          className={cx(
            "ml-1 flex-1",
            theme.dark ? "text-neutral-400" : "text-neutral-500",
          )}
          numberOfLines={1}
        >
          {text}
        </Text>
      </View>
    );
  }
  return (
    <Link
      href={`/profile/${data.post.author.handle}/post/${data.post.uri
        .split("/")
        .pop()}`}
      asChild
      accessibilityHint="Opens parent post"
    >
      <TouchableWithoutFeedback>
        <View className="flex-row items-center">
          <MessageCircleIcon size={12} color={circleColor} />
          <Text
            className={cx(
              "ml-1 flex-1",
              theme.dark ? "text-neutral-400" : "text-neutral-500",
            )}
            numberOfLines={1}
          >
            replying to{" "}
            {data.post.author.displayName ?? `@${data.post.author.handle}`}
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </Link>
  );
};
