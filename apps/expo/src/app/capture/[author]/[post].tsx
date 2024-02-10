import { useRef } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import ViewShot from "react-native-view-shot";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AppBskyFeedDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";

import { PrimaryPost } from "~/components/primary-post";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";

export default function ShareAsImageScreen() {
  const { author, post: rkey } = useLocalSearchParams<{
    post: string;
    author: string;
  }>();

  const agent = useAgent();
  const captureRef = useRef<ViewShot>(null);
  const theme = useTheme();
  const router = useRouter();

  const post = useQuery({
    queryKey: ["profile", author, "post", rkey, "no-context"],
    queryFn: async () => {
      if (!author || !rkey) throw new Error("Invalid author or post");
      let did = author;
      if (!did.startsWith("did:")) {
        const { data } = await agent.resolveHandle({ handle: author });
        did = data.did;
      }
      const uri = `at://${did}/app.bsky.feed.post/${rkey}`;
      const postThread = await agent.getPostThread({
        uri,
        parentHeight: 0,
        depth: 0,
      });

      const post = postThread.data.thread;

      if (!AppBskyFeedDefs.isThreadViewPost(post)) {
        throw new Error("Post not found");
      }

      return post;
    },
  });

  if (post.data) {
    return (
      <>
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior="automatic"
        >
          <ViewShot ref={captureRef} options={{ format: "jpg", quality: 0.9 }}>
            <PrimaryPost
              post={post.data.post}
              dataUpdatedAt={post.dataUpdatedAt}
            />
          </ViewShot>
        </ScrollView>
        <Stack.Screen
          options={{
            headerRight: () => (
              <TouchableOpacity onPress={() => router.push("../")}>
                <Text primary className="text-lg font-medium">
                  Done
                </Text>
              </TouchableOpacity>
            ),
          }}
        />
      </>
    );
  }

  return <QueryWithoutData query={post} />;
}
