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
}

export const Post = ({ post, hasParent, root }: Props) => {
  const { liked, likeCount, toggleLike } = useLike(post);
  const { reposted, repostCount, toggleRepost } = useRepost(post);
  const handleRepost = useHandleRepost(post, reposted, toggleRepost.mutate);
  const handleMore = usePostViewOptions(post);
  const composer = useComposer();

  const profileHref = `/profile/${post.author.handle}`;

  if (!AppBskyFeedPost.isRecord(post.record)) {
    return null;
  }

  assert(AppBskyFeedPost.validateRecord(post.record));

  const { colorScheme, toggleColorScheme } = useColorScheme();

  const buttonColor = colorScheme === "light" ? "#1C1C1E" : "#FFF";

  return (
    <View
      className={cx(
        "border-b border-neutral-200 bg-white px-4 pb-4 pt-3 dark:bg-black",
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
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900">
              <User size={32} color={buttonColor} />
            </View>
          )}
          <View className="justify ml-3 flex-1 flex-row items-center">
            <View className="flex-1">
              <Text
                numberOfLines={1}
                className="max-w-[85%] text-base font-semibold dark:text-neutral-50"
              >
                {post.author.displayName}
              </Text>
              <Text className="text-base leading-5 text-neutral-500 dark:text-neutral-50">
                @{post.author.handle}
              </Text>
            </View>
            <TouchableOpacity onPress={handleMore}>
              <MoreVertical size={18} color={buttonColor} />
            </TouchableOpacity>
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
      <View className="mt-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="flex-row items-center gap-2 p-1"
          onPress={() =>
            composer.open({
              parent: post,
              root,
            })
          }
        >
          <MessageSquare size={18} color={buttonColor} />
          <Text>{post.replyCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity
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
