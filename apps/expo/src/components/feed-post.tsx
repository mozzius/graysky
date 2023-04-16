import { useState } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { type AppBskyFeedPost } from "@atproto/api";
import { type FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { useMutation } from "@tanstack/react-query";
import { Heart, MessageSquare, Repeat, User } from "lucide-react-native";

import { useAuthedAgent } from "../lib/agent";
import { cx } from "../lib/utils/cx";
import { timeSince } from "../lib/utils/time";
import { Embed, type PostEmbed } from "./embed";

interface Props {
  item: FeedViewPost;
  hasReply?: boolean;
}

export const FeedPost = ({ item, hasReply = false }: Props) => {
  const agent = useAuthedAgent();

  const [liked, setLiked] = useState(!!item.post.viewer?.like);
  const [likeUri, setLikeUri] = useState(item.post.viewer?.like);
  const [reposted, setReposted] = useState(!!item.post.viewer?.repost);
  const [repostUri, setRepostUri] = useState(item.post.viewer?.repost);

  const toggleLike = useMutation({
    mutationKey: ["like", item.post.uri],
    mutationFn: async () => {
      if (!likeUri) {
        try {
          setLiked(true);
          const like = await agent.like(item.post.uri, item.post.cid);
          setLikeUri(like.uri);
        } catch (err) {
          setLiked(false);
          console.log(err);
        }
      } else {
        try {
          setLiked(false);
          await agent.deleteLike(likeUri);
          setLikeUri(undefined);
        } catch (err) {
          setLiked(true);
          console.log(err);
        }
      }
    },
  });

  const toggleRepost = useMutation({
    mutationKey: ["repost", item.post.uri],
    mutationFn: async () => {
      if (!repostUri) {
        try {
          setReposted(true);
          const repost = await agent.repost(item.post.uri, item.post.cid);
          setRepostUri(repost.uri);
        } catch (err) {
          setReposted(false);
          console.log(err);
        }
      } else {
        try {
          setReposted(false);
          await agent.deleteRepost(repostUri);
          setRepostUri(undefined);
        } catch (err) {
          setReposted(true);
          console.log(err);
        }
      }
    },
  });

  const profileHref = `/profile/${item.post.author.handle}`;

  const postHref = `${profileHref}/post/${item.post.uri.split("/").pop()}`;

  return (
    <>
      {item.reply?.parent && (
        <FeedPost item={{ post: item.reply.parent }} hasReply />
      )}
      <View
        className={cx(
          "flex-row bg-white px-2 pt-2",
          item.reply?.parent && "pt-0",
          !hasReply && "border-b border-b-neutral-200",
        )}
        // onLayout={(x) => console.log(x.nativeEvent.layout)}
      >
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
              <Text className="w-full text-base" numberOfLines={1}>
                {item.post.author.displayName}{" "}
                <Text className="text-neutral-400" numberOfLines={1}>
                  @{item.post.author.handle}
                </Text>
                {/* get age of post - e.g. 5m */}
                <Text> · {timeSince(new Date(item.post.indexedAt))}</Text>
              </Text>
            </TouchableOpacity>
          </Link>
          {/* text content */}
          <Link href={postHref} asChild>
            <TouchableOpacity>
              <Text className="text-base">
                {(item.post.record as AppBskyFeedPost.Record).text}
              </Text>
            </TouchableOpacity>
          </Link>
          {/* embeds */}
          {item.post.embed && <Embed content={item.post.embed as PostEmbed} />}
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
                {(item.post.repostCount ?? 0) +
                  (reposted && repostUri !== item.post.viewer?.repost ? 1 : 0)}
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
                {(item.post.likeCount ?? 0) +
                  (liked && likeUri !== item.post.viewer?.like ? 1 : 0)}
              </Text>
            </TouchableOpacity>
            <View className="w-8" />
          </View>
        </View>
      </View>
    </>
  );
};
