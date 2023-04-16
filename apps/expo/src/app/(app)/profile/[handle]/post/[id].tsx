import { ScrollView, Text } from "react-native";
import { Stack, useSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../../../../../lib/agent";

export default function PostPage() {
  const { handle, id } = useSearchParams() as { id: string; handle: string };
  const agent = useAuthedAgent();

  const post = useQuery(["profile", handle, "post", id], async () => {
    const {
      data: { did },
    } = await agent.resolveHandle({ handle });
    console.log(did);
    const uri = `at://${did}/app.bsky.feed.post/${id}`;
    const post = await agent.getPostThread({ uri });
    return post.data;
  });

  return (
    <ScrollView>
      <Stack.Screen options={{ headerTitle: "Post" }} />
      <Text>
        {handle}
        {id}
        {JSON.stringify(post.data, null, 2)}
      </Text>
    </ScrollView>
  );
}
