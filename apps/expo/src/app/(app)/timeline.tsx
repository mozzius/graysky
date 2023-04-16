import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Tabs } from "expo-router";
import { type AppBskyFeedPost } from "@atproto/api";
import { type FeedViewPost } from "@atproto/api/dist/client/types/app/bsky/feed/defs";
import { FlashList } from "@shopify/flash-list";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Cloudy, Heart, MessageSquare, Repeat } from "lucide-react-native";

import { Button } from "../../components/button";
import { useAuthedAgent } from "../../lib/agent";

function Timeline() {
  const agent = useAuthedAgent();
  const timeline = useInfiniteQuery({
    queryKey: ["timeline"],
    queryFn: async ({ pageParam }) => {
      const timeline = await agent.getTimeline({
        limit: 5,
        cursor: pageParam as string | undefined,
      });
      return timeline.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  switch (timeline.status) {
    case "loading":
      return (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" />
        </View>
      );

    case "error":
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Text className="text-center text-xl">
            {(timeline.error as Error).message || "An error occurred"}
          </Text>
          <Button variant="outline" onPress={() => void timeline.refetch()}>
            Retry
          </Button>
        </View>
      );

    case "success":
      return (
        <FlashList
          onRefresh={() => {
            if (!timeline.isRefetching) void timeline.refetch();
          }}
          refreshing={timeline.isRefetching}
          onEndReachedThreshold={0.5}
          onEndReached={() => void timeline.fetchNextPage()}
          className="flex-1"
          data={timeline.data.pages.flatMap((page) => page.feed)}
          estimatedItemSize={111}
          renderItem={({ item }) => <Post item={item} />}
        />
      );
  }
}

export default function TimelinePage() {
  return (
    <>
      <Tabs.Screen
        options={{
          tabBarButton: () => (
            <View className="flex-1 items-center justify-center">
              <Cloudy color="#5e5e5e" />
            </View>
          ),
        }}
      />
      <Timeline />
    </>
  );
}

const Post = ({ item }: { item: FeedViewPost }) => {
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

  return (
    <View
      className="gap-2 border border-b border-neutral-200 bg-white px-4 pb-5 pt-1"
      // onLayout={(x) => console.log(x.nativeEvent.layout)}
    >
      <View className="flex-row items-center">
        {item.post.author.avatar && (
          <Image
            source={{ uri: item.post.author.avatar }}
            alt={item.post.author.handle}
            className="mr-2 h-6 w-6 rounded-full"
          />
        )}
        <Text className="w-full text-base" numberOfLines={1}>
          {item.post.author.displayName}{" "}
          <Text className="text-neutral-400">@{item.post.author.handle}</Text>
        </Text>
      </View>
      {/* text content */}
      <Text className="text-base">
        {(item.post.record as AppBskyFeedPost.Record).text}
      </Text>
      {/* embeds */}
      {item.post.embed && <Embed content={item.post.embed as PostEmbed} />}
      {/* actions */}
      <View className="flex-row justify-between">
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
  );
};

type PostEmbed =
  | {
      $type: "app.bsky.embed.images#view";
      images: {
        alt: string;
        fullsize: string;
        thumb: string;
      }[];
    }
  | {
      $type: "app.bsky.embed.external#view";
      external: {
        description: string;
        thumb: string;
        title: string;
        uri: string;
      };
    };

const Embed = ({ content }: { content: PostEmbed }) => {
  switch (content.$type) {
    case "app.bsky.embed.images#view":
      switch (content.images.length) {
        case 0:
          return null;
        case 1:
        default:
          const image = content.images[0]!;
          return (
            <Image
              source={{ uri: image.thumb }}
              alt={image.alt}
              className="my-1.5 aspect-video w-full rounded"
            />
          );
      }
    case "app.bsky.embed.external#view":
      return (
        <TouchableOpacity
          onPress={() => void Linking.openURL(content.external.uri)}
          className="my-1.5 rounded border p-2"
        >
          <Text className="text-base" numberOfLines={2}>
            {content.external.title}
          </Text>
          <Text className="text-sm text-neutral-400" numberOfLines={1}>
            {content.external.uri}
          </Text>
        </TouchableOpacity>
      );
    default:
      console.info("Unsupported embed type", content);
      return (
        <View className="my-1.5 rounded bg-neutral-100 p-2">
          <Text className="text-center">Unsupported embed type</Text>
        </View>
      );
  }
};
