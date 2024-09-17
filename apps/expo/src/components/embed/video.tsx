import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ImageBackground } from "expo-image";
import { AppBskyEmbedVideo } from "@atproto/api";
import { BlueskyVideoView } from "@haileyok/bluesky-video";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { PlayIcon, Volume2Icon, VolumeXIcon } from "lucide-react-native";

import { useThrottledValue } from "~/lib/hooks/throttled-value";
import { useGifAutoplay } from "~/lib/storage/app-preferences";

export const VideoEmbed = ({ video }: { video: AppBskyEmbedVideo.View }) => {
  const { _ } = useLingui();
  const ref = useRef<BlueskyVideoView>(null);

  const [status, setStatus] = useState<"playing" | "paused" | "pending">(
    "pending",
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const showSpinner = useThrottledValue(isActive && isLoading, 100);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const autoplay = useGifAutoplay();

  const showOverlay =
    !isActive ||
    isLoading ||
    (status === "paused" && !isActive) ||
    status === "pending";

  useEffect(() => {
    if (!isActive && status !== "pending") {
      setStatus("pending");
    }
  }, [isActive, status]);

  let aspectRatio = 16 / 9;
  if (video.aspectRatio) {
    const { width, height } = video.aspectRatio;
    aspectRatio = width / height;
    aspectRatio = clamp(aspectRatio, 1 / 1, 3 / 1);
  }

  return (
    <View
      className="mt-1.5 overflow-hidden rounded-lg bg-black"
      style={{ aspectRatio }}
    >
      <View className="relative flex-1">
        <BlueskyVideoView
          url={video.playlist}
          autoplay={autoplay}
          beginMuted={autoplay ? muted : false}
          onActiveChange={(e) => {
            setIsActive(e.nativeEvent.isActive);
          }}
          onLoadingChange={(e) => {
            setIsLoading(e.nativeEvent.isLoading);
          }}
          onMutedChange={(e) => {
            setMuted(e.nativeEvent.isMuted);
          }}
          onStatusChange={(e) => {
            setStatus(e.nativeEvent.status);
            setIsPlaying(e.nativeEvent.status === "playing");
          }}
          onTimeRemainingChange={(e) => {
            setTimeRemaining(e.nativeEvent.timeRemaining);
          }}
          ref={ref}
          accessibilityLabel={
            video.alt ? _(msg`Video: ${video.alt}`) : _(msg`Video`)
          }
          accessibilityHint=""
        />
        <VideoControls
          muted={muted}
          enterFullscreen={() => {
            ref.current?.enterFullscreen();
          }}
          toggleMuted={() => {
            ref.current?.toggleMuted();
          }}
          isPlaying={isPlaying}
          timeRemaining={timeRemaining}
        />
      </View>
      <ImageBackground
        source={{ uri: video.thumbnail }}
        accessibilityIgnoresInvertColors
        className="absolute bottom-0 left-0 right-0 top-0 bg-transparent"
        style={{ display: showOverlay ? "flex" : "none" }}
        cachePolicy="memory-disk" // Preferring memory cache helps to avoid flicker when re-displaying on android
      >
        <TouchableOpacity
          className="flex-1 content-center justify-center"
          onPress={() => {
            ref.current?.togglePlayback();
          }}
          accessibilityLabel={_(msg`Play video`)}
        >
          {showSpinner ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <View className="mx-auto w-max rounded-full bg-black/60 p-4">
              <PlayIcon size={32} color="white" fill="white" strokeWidth={5} />
            </View>
          )}
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
};

function VideoControls({
  enterFullscreen,
  muted,
  toggleMuted,
  timeRemaining,
}: {
  enterFullscreen: () => void;
  muted: boolean;
  toggleMuted: () => void;
  timeRemaining: number;
  isPlaying: boolean;
}) {
  const { _ } = useLingui();

  // show countdown when:
  // 1. timeRemaining is a number - was seeing NaNs
  // 2. duration is greater than 0 - means metadata has loaded
  // 3. we're less than 5 second into the video
  const showTime = !isNaN(timeRemaining);

  return (
    <View className="absolute bottom-0 left-0 right-0 top-0">
      <Pressable
        onPress={enterFullscreen}
        className="flex-1"
        accessibilityLabel={_(msg`Video`)}
        accessibilityHint={_(msg`Tap to enter full screen`)}
        accessibilityRole="button"
      />
      {showTime && <TimeIndicator time={timeRemaining} />}

      <ControlButton
        onPress={toggleMuted}
        label={
          muted
            ? _(msg({ message: `Unmute`, context: "video" }))
            : _(msg({ message: `Mute`, context: "video" }))
        }
        accessibilityHint={_(msg`Tap to toggle sound`)}
      >
        {muted ? (
          <VolumeXIcon size={14} color="white" />
        ) : (
          <Volume2Icon size={14} color="white" />
        )}
      </ControlButton>
    </View>
  );
}

function ControlButton({
  onPress,
  children,
  label,
  accessibilityHint,
}: {
  onPress: () => void;
  children: React.ReactNode;
  label: string;
  accessibilityHint: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="absolute bottom-1 right-1 h-[21px] w-[21px] content-center justify-center rounded-full bg-black/50 pl-[3px]"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityRole="button"
      hitSlop={{ top: 30, left: 30, right: 30, bottom: 30 }}
    >
      {children}
    </Pressable>
  );
}

function TimeIndicator({ time }: { time: number }) {
  if (isNaN(time)) {
    return null;
  }

  const minutes = Math.floor(time / 60);
  const seconds = String(time % 60).padStart(2, "0");

  return (
    <View
      pointerEvents="none"
      className="absolute bottom-1 left-1 min-h-[21px] min-w-[21px] justify-center rounded-md bg-black/50 px-1.5 py-[3px]"
    >
      <Text
        className="text-xs font-bold text-white"
        style={[
          {
            fontVariant: ["tabular-nums"],
            lineHeight: 1.25,
          },
        ]}
      >
        {`${minutes}:${seconds}`}
      </Text>
    </View>
  );
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
