import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useQuery } from "@tanstack/react-query";

import { Post } from "../../../../../components/post";
import { useAuthedAgent } from "../../../../../lib/agent";

export default function PostPage() {
  const { handle, id } = useLocalSearchParams() as {
    id: string;
    handle: string;
  };
  const agent = useAuthedAgent();

  const thread = useQuery(["profile", handle, "post", id], async () => {
    let did = handle;
    if (!did.startsWith("did:")) {
      const { data } = await agent.resolveHandle({ handle });
      did = data.did;
    }
    const uri = `at://${did}/app.bsky.feed.post/${id}`;
    const postThread = await agent.getPostThread({ uri });
    return postThread.data.thread;
  });

  switch (thread.status) {
    case "loading":
      return (
        <View className="flex-1 items-center justify-center">
          <Stack.Screen options={{ headerTitle: "Post" }} />
          <ActivityIndicator />
        </View>
      );
    case "error":
      return (
        <View className="flex-1 items-center justify-center p-4">
          <Stack.Screen options={{ headerTitle: "Post" }} />
          <Text className="text-center text-xl">
            {(thread.error as Error).message || "An error occurred"}
          </Text>
        </View>
      );
    case "success":
      if (thread.data.notFound) {
        return (
          <View className="flex-1 items-center justify-center p-4">
            <Stack.Screen options={{ headerTitle: "Post" }} />
            <Text className="text-center text-xl">Post not found</Text>
          </View>
        );
      }
      const postThread = thread.data as AppBskyFeedDefs.ThreadViewPost;

      return (
        <ScrollView>
          <Stack.Screen options={{ headerTitle: "Post" }} />
          <Post post={postThread.post} />
        </ScrollView>
      );
  }
}
