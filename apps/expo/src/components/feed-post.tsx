import { memo, useEffect, useMemo, useState } from "react";
import { I18nManager, TouchableWithoutFeedback, View } from "react-native";
import { Link } from "expo-router";
import { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircleIcon, RepeatIcon } from "lucide-react-native";

import { type Posts } from "~/app/(tabs)/(feeds,search,notifications,self)/profile/[author]/post/[post]";
import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useAgent } from "~/lib/agent";
import {
  useProfileModeration,
  type FilterResult,
} from "~/lib/hooks/preferences";
import { useContentLanguages } from "~/lib/storage/app-preferences";
import { cx } from "~/lib/utils/cx";
import { isPostInLanguage } from "~/lib/utils/locale/helpers";
import { timeSince } from "~/lib/utils/time";
import { Embed } from "./embed";
import { PostActionRow } from "./post-action-row";
import { PostAvatar } from "./post-avatar";
import { PostContextMenu } from "./post-context-menu";
import { RichText } from "./rich-text";
import { TextButton } from "./text-button";
import { Text } from "./themed/text";
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
  extraPadding?: boolean;
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
  extraPadding,
}: Props) => {
  const showWarning = Boolean(
    !!item.post.author.viewer?.blocking ||
      !!item.post.author.viewer?.blocked ||
      !!filter,
  );
  const { _, i18n } = useLingui();
  const [hidden, setHidden] = useState(showWarning);
  const [forceShowTranslation, setForceShowTranslation] = useState<
    string | null
  >(null);

  const postAuthorDisplayName = item.post.author.displayName;
  const postAuthorHandle = item.post.author.handle;
  const path = useAbsolutePath();

  const theme = useTheme();
  const queryClient = useQueryClient();

  const profileHref = path(`/profile/${item.post.author.did}`);
  const postHref = `${profileHref}/post/${item.post.uri.split("/").pop()}`;

  useEffect(() => {
    setHidden(showWarning);
  }, [item.post.uri, showWarning]);

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

  const contentLanguages = useContentLanguages();

  const needsTranslation = useMemo(
    () => !isPostInLanguage(item.post, contentLanguages),
    [item.post, contentLanguages],
  );

  const moderation = useProfileModeration(item.post.author);

  if (!AppBskyFeedPost.isRecord(item.post.record)) {
    return null;
  }

  const displayInlineParent = inlineParent || !!item.reason;

  const timeSincePost = timeSince(new Date(item.post.indexedAt), i18n);

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
        {filter ? (
          filter.message
        ) : item.post.author.viewer?.muted ? (
          <Trans>This post is from someone you have muted</Trans>
        ) : (
          <Trans>This post is from someone you have blocked</Trans>
        )}
      </Text>
      <TextButton
        title={hidden ? _(msg`Show`) : _(msg`Hide`)}
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
          <PostAvatar
            profile={item.post.author}
            avatarSize={avatarSize}
            moderation={moderation}
          />
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
        <View className={cx("flex-1 pb-1 pl-1 pr-2", extraPadding && "pb-3")}>
          <View className="flex-row items-center">
            <Link
              href={profileHref}
              accessibilityLabel={
                isReply
                  ? `Reply by ${postAuthorDisplayName} @${postAuthorHandle} ${timeSincePost.accessible}`
                  : `${postAuthorDisplayName} @${postAuthorHandle} ${timeSincePost.accessible}`
              }
              accessibilityHint={_(msg`Opens profile`)}
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
              ? AppBskyFeedDefs.isPostView(item.reply.parent) && (
                  <Link
                    href={path(
                      `/profile/${
                        item.reply.parent.author.did
                      }/post/${item.reply.parent.uri.split("/").pop()}`,
                    )}
                    asChild
                    accessibilityHint={_(msg`Opens parent post`)}
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
                          <Trans>
                            replying to{" "}
                            {item.reply.parent.author.displayName ??
                              `@${item.reply.parent.author.handle}`}
                          </Trans>
                        </Text>
                      </View>
                    </TouchableWithoutFeedback>
                  </Link>
                )
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
                    <TouchableWithoutFeedback
                      accessibilityHint={_(msg`Opens post details`)}
                      className="w-full"
                    >
                      <View className="mb-0.5 mt-px flex-1 lg:pr-24">
                        <RichText
                          text={item.post.record.text}
                          facets={item.post.record.facets}
                          numberOfLines={numberOfLines}
                          selectable={false}
                        />
                      </View>
                    </TouchableWithoutFeedback>
                  </Link>
                  {(needsTranslation || forceShowTranslation) && (
                    <Translation
                      uri={item.post.uri}
                      text={item.post.record.text}
                      forceShow={forceShowTranslation === item.post.uri}
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
            <PostActionRow post={item.post} dataUpdatedAt={dataUpdatedAt}>
              <PostContextMenu
                post={{ ...item.post, record: item.post.record }}
                showCopyText
                onTranslate={
                  needsTranslation
                    ? undefined
                    : () => setForceShowTranslation(item.post.uri)
                }
              />
            </PostActionRow>
          )}
        </View>
      </View>
    </View>
  );
};

const Reason = ({ item }: Pick<Props, "item">) => {
  const theme = useTheme();
  const path = useAbsolutePath();
  const { _ } = useLingui();

  if (!AppBskyFeedDefs.isReasonRepost(item.reason)) return null;

  return (
    <View className="mb-1 ml-12 flex-1">
      <Link
        href={path(`/profile/${item.reason.by.did}`)}
        asChild
        accessibilityHint={_(msg`Opens profile`)}
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
                theme.dark ? "text-neutral-400" : "text-neutral-600",
              )}
              numberOfLines={1}
            >
              <Trans>
                Reposted by{" "}
                {item.reason.by.displayName || `@${item.reason.by.handle}`}
              </Trans>
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
  const path = useAbsolutePath();
  const { _ } = useLingui();

  const circleColor = !theme.dark ? "#737373" : "#D4D4D4";

  const agent = useAgent();
  const { data, isPending } = useQuery({
    queryKey: ["post", uri],
    queryFn: async () => {
      const thread = await agent.getPostThread({
        uri,
        depth: 0,
        parentHeight: 1,
      });
      return thread.data.thread.parent ?? null;
    },
  });

  if (!AppBskyFeedDefs.isThreadViewPost(data)) {
    let text = _(msg`replying to a post that couldn't be fetched`);
    if (isPending) {
      text = _(msg`replying to...`);
    }
    if (AppBskyFeedDefs.isBlockedPost(data)) {
      text = _(msg`replying to a blocked user`);
    }
    if (AppBskyFeedDefs.isNotFoundPost(data)) {
      text = _(msg`replying to a deleted post`);
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
      href={path(
        `/profile/${data.post.author.did}/post/${data.post.uri
          .split("/")
          .pop()}`,
      )}
      asChild
      accessibilityHint={_(msg`Opens parent post`)}
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
            <Trans>
              replying to{" "}
              {data.post.author.displayName ?? `@${data.post.author.handle}`}
            </Trans>
          </Text>
        </View>
      </TouchableWithoutFeedback>
    </Link>
  );
};
