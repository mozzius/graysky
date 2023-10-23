import { useState } from "react";
import {
  Linking,
  Platform,
  Share,
  StyleSheet,
  TouchableHighlight,
  View,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import { Image } from "expo-image";
import { type AppBskyEmbedExternal } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { LinkIcon } from "lucide-react-native";

import { useLinkPress } from "~/lib/hooks/link-press";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { cx } from "~/lib/utils/cx";
import { Text } from "../text";

interface Props {
  content: AppBskyEmbedExternal.View;
  transparent: boolean;
  depth: number;
}

export const ExternalEmbed = ({ content, transparent, depth }: Props) => {
  const theme = useTheme();
  const onLongPressLink = useLinkPress();

  const uri = new URL(content.external.uri);

  if (uri.hostname === "media.tenor.com" && uri.pathname.endsWith(".mp4")) {
    return (
      <Gif
        uri={content.external.uri}
        link={uri}
        title={content.external.title}
        thumb={content.external.thumb}
        transparent={transparent}
        depth={depth}
      />
    );
  } else if (
    uri.hostname === "graysky.app" &&
    uri.pathname.startsWith("/gif/")
  ) {
    const decoded = decodeURIComponent(uri.pathname.slice("/gif/".length));
    const tenorUrl = `https://media.tenor.com/${decoded}`;
    return (
      <Gif
        uri={tenorUrl}
        link={uri}
        title={content.external.title}
        thumb={content.external.thumb}
        transparent={transparent}
        depth={depth}
      />
    );
  }

  return (
    <TouchableHighlight
      accessibilityRole="link"
      className="mt-1.5 flex-1 rounded-lg"
      onPress={() => Linking.openURL(content.external.uri)}
      onLongPress={() => onLongPressLink(content.external.uri)}
    >
      <View
        className={cx(
          "flex-1 overflow-hidden rounded-lg border",
          theme.dark ? "bg-black" : "bg-white",
          transparent && "bg-transparent",
          depth > 0 && "flex-row",
        )}
        style={{ borderColor: theme.colors.border }}
      >
        {content.external.thumb && (
          <Image
            recyclingKey={content.external.thumb}
            source={{ uri: content.external.thumb }}
            alt={content.external.title || content.external.uri}
            contentFit="cover"
            className={cx(
              "object-cover",
              depth === 0 ? "aspect-[2/1] w-full" : "aspect-square h-full",
            )}
          />
        )}
        <View
          className={cx(
            "flex-1 p-2",
            content.external.thumb && (depth === 0 ? "border-t" : "border-l"),
          )}
          style={{ borderColor: theme.colors.border }}
        >
          <View className="flex-1 flex-row items-center">
            <LinkIcon
              size={12}
              className="mr-1 text-neutral-400 dark:text-neutral-100"
            />
            <Text
              className="text-sm leading-4 text-neutral-400 dark:text-neutral-100"
              numberOfLines={1}
            >
              {new URL(content.external.uri).hostname}
            </Text>
          </View>
          <Text
            className="mt-1 text-base leading-5"
            numberOfLines={depth === 0 ? 2 : 1}
          >
            {content.external.title || content.external.uri}
          </Text>
          {content.external.description &&
            depth === 0 &&
            !content.external.thumb && (
              <Text className="mt-0.5 text-sm leading-5" numberOfLines={2}>
                {content.external.description}
              </Text>
            )}
        </View>
      </View>
    </TouchableHighlight>
  );
};

interface GifProps {
  uri: string;
  link: URL;
  title: string;
  thumb?: string;
  transparent: boolean;
  depth: number;
}

const Gif = ({ uri, link, title, thumb, transparent, depth }: GifProps) => {
  const theme = useTheme();
  const [aspectRatio, setAspectRatio] = useState(1);
  const [{ gifAutoplay }] = useAppPreferences();
  const [playing, setPlaying] = useState(gifAutoplay);

  const shareUrl = link.toString();

  return (
    <TouchableHighlight
      accessibilityRole="link"
      className="mt-1.5 flex-1 rounded-lg"
      onPress={gifAutoplay ? undefined : () => setPlaying((p) => !p)}
      onLongPress={() =>
        Share.share(
          Platform.select({
            ios: { url: shareUrl },
            default: { message: shareUrl },
          }),
        )
      }
    >
      <View
        className={cx(
          "relative flex-1 overflow-hidden rounded-lg",
          theme.dark ? "bg-black" : "bg-white",
          transparent && "bg-transparent",
          depth > 0 && "flex-row",
        )}
        style={{
          borderColor: theme.colors.border,
          borderWidth: StyleSheet.hairlineWidth,
        }}
      >
        <View className="absolute bottom-1.5 left-1.5 z-10 rounded bg-black/60 px-1 py-px">
          <Text className="text-xs font-medium text-white">
            GIF{!playing && " (tap to play)"}
          </Text>
        </View>
        <Video
          source={{ uri }}
          resizeMode={ResizeMode.COVER}
          shouldPlay={playing}
          isLooping
          isMuted
          style={{ flex: 1, aspectRatio }}
          posterSource={{ uri: thumb }}
          onReadyForDisplay={({ naturalSize }) =>
            setAspectRatio(naturalSize.width / naturalSize.height)
          }
          accessibilityLabel={title}
        />
      </View>
    </TouchableHighlight>
  );
};
