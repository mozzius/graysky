import { TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppBskyEmbedImages, AppBskyFeedDefs } from "@atproto/api";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react-native";

import { ImageViewer } from "../../components/image-viewer";
import { useAuthedAgent } from "../../lib/agent";
import { assert } from "../../lib/utils/assert";

export default function ImageModal() {
  const agent = useAuthedAgent();
  const router = useRouter();
  const { post, initial } = useLocalSearchParams() as {
    post: string;
    initial?: string;
  };

  const uri = decodeURIComponent(post);

  const images = useQuery({
    queryKey: ["images", uri],
    queryFn: async () => {
      const record = await agent.getPostThread({
        uri,
        depth: 0,
      });

      if (!AppBskyFeedDefs.isThreadViewPost(record.data.thread)) {
        throw new Error("Invalid thread post");
      }
      assert(AppBskyFeedDefs.validateThreadViewPost(record.data.thread));

      if (!AppBskyEmbedImages.isView(record.data.thread.post.embed)) {
        throw new Error("Invalid embed");
      }
      assert(AppBskyEmbedImages.validateView(record.data.thread.post.embed));

      return record.data.thread.post.embed.images;
    },
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  if (images.isError) {
    console.warn(images.error);
    router.back();
  }

  const { top } = useSafeAreaInsets();

  return (
    <View className="relative flex-1 bg-black">
      <StatusBar style="auto" />
      <Stack.Screen
        options={{
          animation: "fade",
          fullScreenGestureEnabled: false,
          headerShown: false,
        }}
      />
      <TouchableOpacity
        onPress={() => router.back()}
        className="absolute right-5 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/40"
        style={{ top: top + 10 }}
      >
        <X color="#ffffff" />
      </TouchableOpacity>
      <ImageViewer
        images={images.data ?? []}
        onClose={() => router.back()}
        initialIndex={Number(initial) || 0}
      />
    </View>
  );
}
