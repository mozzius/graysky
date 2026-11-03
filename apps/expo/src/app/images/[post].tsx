import { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import Animated, { FadeInUp, FadeOutUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { type AtIdentifierString, type AtUriString } from "@atproto/lex";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useQuery } from "@tanstack/react-query";
import { XIcon } from "lucide-react-native";

import { ImageViewer } from "~/components/image-viewer";
import { StatusBar } from "~/components/status-bar";
import { useAgent } from "~/lib/agent";
import { isType } from "~/lib/utils/types";

export default function ImageModal() {
  const agent = useAgent();
  const router = useRouter();
  const [infoVisible, setInfoVisible] = useState(true);
  const { _ } = useLingui();
  const { post, initial } = useLocalSearchParams();

  const source = decodeURIComponent(typeof post === "string" ? post : "");

  const images = useQuery({
    queryKey: ["images", source],
    queryFn: async () => {
      if (source.startsWith("did:")) {
        // profile avatar
        const profile = await agent.call(app.bsky.actor.getProfile, {
          actor: source as AtIdentifierString,
        });

        if (!profile.avatar) throw new Error("No avatar");
        return [
          {
            alt: profile.displayName ?? `@${profile.handle}`,
            fullsize: profile.avatar,
            thumb: profile.avatar,
          } satisfies app.bsky.embed.images.ViewImage,
        ];
      } else {
        // post embeds
        const record = await agent.call(app.bsky.feed.getPostThread, {
          uri: source as AtUriString,
          depth: 0,
          parentHeight: 0,
        });

        if (!isType(app.bsky.feed.defs.threadViewPost, record.thread)) {
          throw new Error("Invalid thread post");
        }

        if (isType(app.bsky.embed.images.view, record.thread.post.embed)) {
          return record.thread.post.embed.images;
        } else if (
          isType(app.bsky.embed.recordWithMedia.view, record.thread.post.embed)
        ) {
          if (
            isType(app.bsky.embed.images.view, record.thread.post.embed.media)
          ) {
            return record.thread.post.embed.media.images;
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
