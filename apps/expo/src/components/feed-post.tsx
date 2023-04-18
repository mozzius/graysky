import { Image, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { type AppBskyFeedDefs, type AppBskyFeedPost } from "@atproto/api";
import { Heart, MessageSquare, Repeat, User } from "lucide-react-native";

import { useLike, useRepost } from "../lib/hooks";
import { cx } from "../lib/utils/cx";
import { timeSince } from "../lib/utils/time";
import { Embed, type PostEmbed } from "./embed";

interface Props {
  item: AppBskyFeedDefs.FeedViewPost;
  hasReply?: boolean;
}

export const FeedPost = ({ item, hasReply = false }: Props) => {
  const { liked, likeCount, toggleLike } = useLike(item.post);
  const { reposted, repostCount, toggleRepost } = useRepost(item.post);

  const profileHref = `/profile/${item.post.author.handle}`;

  const postHref = `${profileHref}/post/${item.post.uri.split("/").pop()}`;

  return (
    <>
      {item.reply?.parent && (
        <FeedPost item={{ post: item.reply.parent }} hasReply />
      )}
      <View
        className={cx(
          "bg-white px-2 pt-2",
          item.reply?.parent && "pt-0",
          !hasReply && "border-b border-b-neutral-200",
        )}
        // onLayout={(x) => console.log(x.nativeEvent.layout)}
      >
        {item.reason && (
          <View className="mb-1 ml-16 flex-1 flex-row items-center">
            {reasonToText(item.reason as AppBskyFeedDefs.ReasonRepost)}
          </View>
        )}
        <View className="flex-1 flex-row">
          {/* left col */}
          <View className="flex flex-col items-center px-2">
            <Link href={profileHref} asChild>
              <TouchableOpacity>
                {item.post.author.avatar ? (
                  <Image
                    source={{ uri: item.post.author.avatar }}
                    alt={item.post.author.handle}
                    className="h-12 w-12 rounded-full"
                  />
                ) : (
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                    <User size={32} color="#1C1C1E" />
                  </View>
                )}
              </TouchableOpacity>
            </Link>
            <Link href={postHref} asChild>
              <TouchableOpacity className="w-full grow items-center">
                {hasReply && <View className="w-1 grow bg-neutral-200" />}
              </TouchableOpacity>
            </Link>
          </View>

          {/* right col */}
          <View className="flex-1 pb-2.5 pl-1 pr-2">
            <Link href={profileHref} asChild>
              <TouchableOpacity className="flex-row items-center">
                <Text numberOfLines={1} className="max-w-[85%] text-base">
                  <Text className="font-semibold">
                    {item.post.author.displayName}
                  </Text>
                  <Text className="text-neutral-500">
                    {` @${item.post.author.handle}`}
                  </Text>
                </Text>
                {/* get age of post - e.g. 5m */}
                <Text className="text-base text-neutral-500">
                  {" "}
                  · {timeSince(new Date(item.post.indexedAt))}
                </Text>
              </TouchableOpacity>
            </Link>
            {/* text content */}
            <Link href={postHref} asChild>
              <TouchableOpacity>
                <Text className="text-base leading-6">
                  {(item.post.record as AppBskyFeedPost.Record).text}
                </Text>
              </TouchableOpacity>
            </Link>
            {/* embeds */}
            {item.post.embed && (
              <Embed content={item.post.embed as PostEmbed} />
            )}
            {/* actions */}
            <View className="mt-2 flex-row justify-between">
              <TouchableOpacity className="flex-row items-center gap-2">
                <MessageSquare size={16} color="#1C1C1E" />
                <Text>{item.post.replyCount}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={toggleRepost.isLoading}
                onPress={() => toggleRepost.mutate()}
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
        </View>
      </View>
    </>
  );
};

const reasonToText = (reason: AppBskyFeedDefs.ReasonRepost) => {
  switch (reason.$type) {
    case "app.bsky.feed.defs#reasonRepost":
      return (
        <>
          <Repeat color="#1C1C1E" size={12} />
          <Text className="ml-1.5 flex-1 text-sm" numberOfLines={1}>
            Reposted by {reason.by.displayName ?? reason.by.handle}
          </Text>
        </>
      );
    default:
      console.log("unknown reason type", reason.$type);
      return null;
  }
};
