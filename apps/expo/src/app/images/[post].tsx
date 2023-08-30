import { TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  AppBskyEmbedImages,
  AppBskyEmbedRecordWithMedia,
  AppBskyFeedDefs,
} from "@atproto/api";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react-native";

import { ImageViewer } from "~/components/image-viewer";
import { useAgent } from "~/lib/agent";
import { assert } from "~/lib/utils/assert";

export default function ImageModal() {
  const agent = useAgent();
  const router = useRouter();
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
        assert(AppBskyFeedDefs.validateThreadViewPost(record.data.thread));

        if (AppBskyEmbedImages.isView(record.data.thread.post.embed)) {
          assert(
            AppBskyEmbedImages.validateView(record.data.thread.post.embed),
          );

          return record.data.thread.post.embed.images;
        } else if (
          AppBskyEmbedRecordWithMedia.isView(record.data.thread.post.embed)
        ) {
          assert(
            AppBskyEmbedRecordWithMedia.validateView(
              record.data.thread.post.embed,
            ),
          );

          if (
            AppBskyEmbedImages.isView(record.data.thread.post.embed.media.embed)
          ) {
            assert(
              AppBskyEmbedImages.validateView(
                record.data.thread.post.embed.media.embed,
              ),
            );

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
    <Animated.View
      className="relative flex-1 bg-black"
      entering={FadeIn}
      // exiting={FadeOut}
    >
      {/* background is always black, so status bar should always be light */}
      <StatusBar style="light" backgroundColor="black" />
      <TouchableOpacity
        accessibilityLabel="Back"
        accessibilityRole="button"
        onPress={() => router.back()}
        className="absolute right-5 z-10 h-10 w-10 items-center justify-center rounded-full bg-black/40"
        style={{ top: top + 10 }}
      >
        <XIcon color="white" />
      </TouchableOpacity>
      {images.data && (
        <ImageViewer
          images={images.data}
          onClose={() => router.back()}
          initialIndex={Number(initial) || 0}
        />
      )}
    </Animated.View>
  );
}
