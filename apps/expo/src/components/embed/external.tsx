import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
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
import { LinkIcon, NewspaperIcon } from "lucide-react-native";

import { useLinkPress } from "~/lib/hooks/link-press";
import { useGifAutoplay } from "~/lib/storage/app-preferences";
import { cx } from "~/lib/utils/cx";
import { Text } from "../themed/text";

interface Props {
  content: AppBskyEmbedExternal.View;
  transparent: boolean;
  depth: number;
}

export const ExternalEmbed = ({ content, transparent, depth }: Props) => {
  const theme = useTheme();
  const { openLink, showLinkOptions } = useLinkPress();

  const uri = new URL(content.external.uri);

  // tenor - gif
  if (
    (uri.hostname === "tenor.com" || uri.hostname === "www.tenor.com") &&
    uri.pathname.includes("/view/")
  ) {
    const [_, pathOrIntl, pathOrFilename, intlFilename] =
      uri.pathname.split("/");
    const isIntl = pathOrFilename === "view";
    const filename = isIntl ? intlFilename : pathOrFilename;

    if ((pathOrIntl === "view" || pathOrFilename === "view") && filename) {
      const includesExt = filename.split(".").pop() === "gif";
      const source = `${uri.toString()}${!includesExt ? ".gif" : ""}`;
      return (
        <Gif
          type="gif"
          uri={source}
          link={uri}
          title={content.external.title}
          transparent={transparent}
          depth={depth}
        />
      );
    }
  }
  // giphy - gif
  else if (
    uri.hostname === "giphy.com" ||
    uri.hostname.endsWith(".giphy.com")
  ) {
    const giphyParams = getGiphyUrl(uri);
    if (giphyParams) {
      return (
        <Gif
          type="gif"
          uri={giphyParams.playerUri}
          link={giphyParams.metaUri}
          title={content.external.title}
          transparent={transparent}
          depth={depth}
        />
      );
    }
  }
  // tenor - mp4
  else if (
    uri.hostname === "media.tenor.com" &&
    uri.pathname.endsWith(".mp4")
  ) {
    return (
      <Gif
        type="mp4"
        uri={content.external.uri}
        link={uri}
        title={content.external.title}
        thumb={content.external.thumb}
        transparent={transparent}
        depth={depth}
      />
    );
  }
  // tenor - mp4, via graysky.app
  else if (uri.hostname === "graysky.app" && uri.pathname.startsWith("/gif/")) {
    const decoded = decodeURIComponent(uri.pathname.slice("/gif/".length));
    const tenorUrl = `https://media.tenor.com/${decoded}`;
    return (
      <Gif
        type="mp4"
        uri={tenorUrl}
        link={uri}
        title={content.external.title}
        transparent={transparent}
        depth={depth}
      />
    );
  }

  return (
    <TouchableHighlight
      accessibilityRole="link"
      className="mt-1.5 flex-1 rounded-lg"
      onPress={() => openLink(content.external.uri)}
      onLongPress={() => showLinkOptions(content.external.uri)}
    >
      <View
        className={cx(
          "flex-1 overflow-hidden rounded-lg border",
          theme.dark ? "bg-black" : "bg-white",
          transparent && "bg-transparent",
          (depth > 0 || !content.external.thumb) && "flex-row",
        )}
        style={{ borderColor: theme.colors.border }}
      >
        {content.external.thumb ? (
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
        ) : (
          <View className="h-full items-center justify-center bg-neutral-100 px-3 dark:bg-neutral-900">
            <NewspaperIcon
              size={24}
              className="text-neutral-300 dark:text-neutral-700"
            />
          </View>
        )}
        <View
          className={cx(
            "flex-1 p-2",
            content.external.thumb &&
              (depth === 0 || !content.external.thumb
                ? "border-t"
                : "border-l"),
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
        </View>
      </View>
    </TouchableHighlight>
  );
};

interface GifProps {
  type: "gif" | "mp4";
  uri: string;
  link: URL | string;
  title: string;
  thumb?: string;
  transparent: boolean;
  depth: number;
}

const Gif = ({
  type,
  uri,
  link,
  title,
  thumb,
  transparent,
  depth,
}: GifProps) => {
  const theme = useTheme();
  const [aspectRatio, setAspectRatio] = useState(1);
  const gifAutoplay = useGifAutoplay();
  const [playing, setPlaying] = useState(gifAutoplay);
  const videoRef = useRef<Video>(null);
  const imageRef = useRef<Image>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const shareUrl = link.toString();

  useEffect(() => {
    if (type === "gif" && imageRef.current) {
      if (playing) {
        void imageRef.current.startAnimating();
      } else {
        void imageRef.current.stopAnimating();
      }
    }
  }, [playing, type]);

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
      <>
        {(loading || error) && (
          <View
            className="absolute left-0 top-0 z-50 h-full w-full flex-1 items-center justify-center gap-4"
            pointerEvents="none"
          >
            {loading && <ActivityIndicator size="large" />}
            {error && (
              <View className="mt-4 rounded bg-black/60 px-1 py-px">
                <Text className="text-xs font-medium text-white">
                  Error: could not load GIF
                </Text>
              </View>
            )}
          </View>
        )}
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
          {type === "gif" ? (
            <Image
              ref={imageRef}
              source={uri}
              recyclingKey={uri}
              alt={title}
              autoplay={gifAutoplay}
              style={{ flex: 1, aspectRatio }}
              onLoad={({ source: { width, height } }) =>
                setAspectRatio(width / height)
              }
              onLoadEnd={() => setLoading(false)}
              onError={() => setError(true)}
            />
          ) : (
            <Video
              ref={videoRef}
              resizeMode={ResizeMode.COVER}
              shouldPlay={playing}
              source={{ uri }}
              isLooping
              isMuted
              usePoster
              style={{ flex: 1, aspectRatio }}
              onPlaybackStatusUpdate={(status) => {
                if (status.isLoaded) {
                  setLoading(false);
                  setError(false);
                  if (videoRef.current) {
                    if (gifAutoplay) {
                      if (!status.isPlaying) void videoRef.current.playAsync();
                    }
                    if (!status.isLooping) {
                      void videoRef.current.setIsLoopingAsync(true);
                    }
                  }
                } else if (status.error) {
                  setLoading(false);
                  setError(true);
                  console.error(status.error);
                } else {
                  setLoading(true);
                  setError(false);
                }
              }}
              posterSource={{ uri: thumb }}
              onReadyForDisplay={({ naturalSize }) =>
                setAspectRatio(naturalSize.width / naturalSize.height)
              }
              accessibilityLabel={title}
            />
          )}
        </View>
      </>
    </TouchableHighlight>
  );
};

// Taken from the official app
// Thanks @haileyok.com!
const giphyRegex = /media(?:[0-4]\.giphy\.com|\.giphy\.com)/i;
const gifFilenameRegex = /^(\S+)\.(webp|gif|mp4)$/i;

const getGiphyUrl = (urlp: URL) => {
  if (urlp.hostname === "giphy.com" || urlp.hostname === "www.giphy.com") {
    const [_, gifs, nameAndId] = urlp.pathname.split("/");

    /*
     * nameAndId is a string that consists of the name (dash separated) and the id of the gif (the last part of the name)
     * We want to get the id of the gif, then direct to media.giphy.com/media/{id}/giphy.webp so we can
     * use it in an <Image> component
     */

    if (gifs === "gifs" && nameAndId) {
      const gifId = nameAndId.split("-").pop();

      if (gifId) {
        return {
          type: "giphy_gif",
          source: "giphy",
          isGif: true,
          hideDetails: true,
          metaUri: `https://giphy.com/gifs/${gifId}`,
          playerUri: `https://i.giphy.com/media/${gifId}/giphy.webp`,
        };
      }
    }
  }

  // There are five possible hostnames that also can be giphy urls: media.giphy.com and media0-4.giphy.com
  // These can include (presumably) a tracking id in the path name, so we have to check for that as well
  if (giphyRegex.test(urlp.hostname)) {
    // We can link directly to the gif, if its a proper link
    const [_, media, trackingOrId, idOrFilename, filename] =
      urlp.pathname.split("/");

    if (media === "media") {
      if (idOrFilename && gifFilenameRegex.test(idOrFilename)) {
        return {
          type: "giphy_gif",
          source: "giphy",
          isGif: true,
          hideDetails: true,
          metaUri: `https://giphy.com/gifs/${trackingOrId}`,
          playerUri: `https://i.giphy.com/media/${trackingOrId}/giphy.webp`,
        };
      } else if (filename && gifFilenameRegex.test(filename)) {
        return {
          type: "giphy_gif",
          source: "giphy",
          isGif: true,
          hideDetails: true,
          metaUri: `https://giphy.com/gifs/${idOrFilename}`,
          playerUri: `https://i.giphy.com/media/${idOrFilename}/giphy.webp`,
        };
      }
    }
  }

  // Finally, we should see if it is a link to i.giphy.com. These links don't necessarily end in .gif but can also
  // be .webp
  if (urlp.hostname === "i.giphy.com" || urlp.hostname === "www.i.giphy.com") {
    const [_, mediaOrFilename, filename] = urlp.pathname.split("/");

    if (mediaOrFilename === "media" && filename) {
      const gifId = filename.split(".")[0];
      return {
        type: "giphy_gif",
        source: "giphy",
        isGif: true,
        hideDetails: true,
        metaUri: `https://giphy.com/gifs/${gifId}`,
        playerUri: `https://i.giphy.com/media/${gifId}/giphy.webp`,
      };
    } else if (mediaOrFilename) {
      const gifId = mediaOrFilename.split(".")[0];
      return {
        type: "giphy_gif",
        source: "giphy",
        isGif: true,
        hideDetails: true,
        metaUri: `https://giphy.com/gifs/${gifId}`,
        playerUri: `https://i.giphy.com/media/${
          mediaOrFilename.split(".")[0]
        }/giphy.webp`,
      };
    }
  }
};
