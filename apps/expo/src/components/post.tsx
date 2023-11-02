import { useMemo, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { AppBskyFeedPost, type AppBskyFeedDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";

import { useAppPreferences } from "~/lib/hooks/preferences";
import { useAbsolutePath } from "~/lib/hooks/use-absolute-path";
import { locale } from "~/lib/locale";
import { assert } from "~/lib/utils/assert";
import { cx } from "~/lib/utils/cx";
import { isPostInLanguage } from "~/lib/utils/locale/helpers";
import { Embed } from "./embed";
import { PostActionRow } from "./post-action-row";
import { PostAvatar } from "./post-avatar";
import { PostContextMenu } from "./post-context-menu";
import { RichText } from "./rich-text";
import { Text } from "./text";
import { Translation } from "./translation";

interface Props {
  post: AppBskyFeedDefs.PostView;
  hasParent?: boolean;
  dataUpdatedAt: number;
}

export const Post = ({ post, hasParent, dataUpdatedAt }: Props) => {
  const theme = useTheme();
  const [forceShowTranslation, setForceShowTranslation] = useState<
    string | null
  >(null);
  const path = useAbsolutePath();

  const postAuthorDisplayName = post.author.displayName;
  const postAuthorHandle = post.author.handle;
  const profileHref = path(`/profile/${post.author.did}`);

  const [{ contentLanguages }] = useAppPreferences();

  const needsTranslation = useMemo(
    () => !isPostInLanguage(post, contentLanguages),
    [post, contentLanguages],
  );

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
      <View className="mb-2 flex-row items-center">
        <PostAvatar profile={post.author} />
        <View className="justify ml-3 flex-1 flex-row items-center">
          <Link
            href={profileHref}
            accessibilityHint="Opens profile"
            accessibilityLabel={`${
              postAuthorDisplayName ?? ""
            } @${postAuthorHandle}`}
            asChild
          >
            <TouchableOpacity className="flex-1">
              <Text numberOfLines={1} className="text-base font-semibold">
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
          <PostContextMenu
            post={post}
            showSeeLikes
            showSeeReposts
            showCopyText
            onTranslate={
              needsTranslation
                ? undefined
                : () => setForceShowTranslation(post.uri)
            }
          />
        </View>
      </View>
      {/* text content */}
      {post.record.text && (
        <>
          <View className="flex-1 lg:pr-24">
            <RichText
              text={post.record.text}
              facets={post.record.facets}
              size="lg"
              selectable
            />
          </View>
          {(needsTranslation || forceShowTranslation) && (
            <View className="mt-1">
              <Translation
                uri={post.uri}
                text={post.record.text}
                forceShow={forceShowTranslation === post.uri}
              />
            </View>
          )}
        </>
      )}
      {/* embeds */}
      {post.embed && (
        <View className="flex-1">
          <Embed uri={post.uri} content={post.embed} truncate={false} />
        </View>
      )}
      {/* actions */}
      <PostActionRow post={post} dataUpdatedAt={dataUpdatedAt} className="mt-4">
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
      </PostActionRow>
    </View>
  );
};
