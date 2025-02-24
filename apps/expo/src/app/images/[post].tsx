import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
} from "@atproto/api";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react-native";

import { ImageViewer } from "~/components/image-viewer";
import { StatusBar } from "~/components/status-bar";
import { useAgent } from "~/lib/agent";

export default function ImageModal() {
  const agent = useAgent();
  const router = useRouter();
  const [infoVisible, setInfoVisible] = useState(true);
  const { _ } = useLingui();
  const { post, initial } = useLocalSearchParams() as {
    post: string;
    initial?: string;
  };

  const source = decodeURIComponent(post);

  const images = useQuery({
    queryKey: ["images", source],
    queryFn: async () => {
      if (source.startsWith("did:")) {
        // profile avatar
        const profile = await agent.getProfile({
          actor: source,
        });

        if (!profile.data.avatar) throw new Error("No avatar");
        return [
          {
            alt: profile.data.displayName ?? `@${profile.data.handle}`,
            fullsize: profile.data.avatar,
            thumb: profile.data.avatar,
          } satisfies AppBskyEmbedImages.ViewImage,
        ];
      } else {
        // post embeds
        const record = await agent.getPostThread({
          uri: source,
          depth: 0,
          parentHeight: 0,
        });

        if (!AppBskyFeedDefs.isThreadViewPost(record.data.thread)) {
          throw new Error("Invalid thread post");
        }

        if (AppBskyEmbedImages.isView(record.data.thread.post.embed)) {
          return record.data.thread.post.embed.images;
        } else if (
          AppBskyEmbedRecordWithMedia.isView(record.data.thread.post.embed)
        ) {
          if (
            AppBskyEmbedImages.isView(record.data.thread.post.embed.media.embed)
          ) {
            return record.data.thread.post.embed.media.embed.images;
          }
        }
        throw new Error("Invalid embed");
      }
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
      <StatusBar style="light" applyToNavigationBar />
      {infoVisible && (
        <TouchableOpacity
          accessibilityLabel={_(msg`Close image modal`)}
          accessibilityRole="button"
          onPress={() => router.back()}
          className="absolute left-5 z-10"
          style={{ top: top + 10 }}
        >
          <Animated.View
            entering={FadeInUp}
            exiting={FadeOutUp}
            className="h-10 w-10 items-center justify-center rounded-full bg-black/50"
          >
            <XIcon color="white" />
          </Animated.View>
        </TouchableOpacity>
      )}
      {images.data && (
        <ImageViewer
          images={images.data}
          onClose={() => router.back()}
          initialIndex={Number(initial) || 0}
          infoVisible={infoVisible}
          toggleInfo={() => setInfoVisible((v) => !v)}
        />
      )}
    </View>
  );
}
