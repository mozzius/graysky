import { useEffect, useRef, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useSafeAreaFrame } from "react-native-safe-area-context";
import { type SearchBarCommands } from "react-native-screens";
import { toast } from "sonner-native";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { useVideoPlayer, VideoView } from "expo-video";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import Sentry from "@sentry/react-native";
import { FlashList } from "@shopify/flash-list";
import { keepPreviousData, useMutation } from "@tanstack/react-query";

import { type TenorResponse } from "@graysky/api/src/router/gifs";

import { ListFooterComponent } from "~/components/list-footer";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useComposerState } from "~/lib/composer/state";
import { useLinkPress } from "~/lib/hooks/link-press";
import { useHaptics } from "~/lib/hooks/preferences";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { locale } from "~/lib/locale";
import { api } from "~/lib/utils/api";
import { produce } from "~/lib/utils/produce";
import { useUserRefresh } from "~/lib/utils/query";
import { uploadBlob } from "~/lib/utils/upload-blob";

const useDebounce = <T,>(value: T, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay);

    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
};

export default function GifSearch() {
  const ref = useRef<SearchBarCommands>(null!);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const { width } = useSafeAreaFrame();
  const theme = useTheme();

  const headerSearchBarOptions = useSearchBarOptions({
    ref,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onChangeText: (evt) => setQuery(evt.nativeEvent.text),
    onCancelButtonPress: () => {
      setQuery("");
      ref.current?.blur();
    },
    placeholder: "Search Tenor",
    hideWhenScrolling: false,
  });

  const langTag = locale.languageTag.includes("-")
    ? locale.languageTag.replace("-", "_")
    : undefined;

  const featured = api.gifs.tenor.featured.useInfiniteQuery(
    { locale: langTag },
    { getNextPageParam: (lastPage) => lastPage.next },
  );

  const isSearching = query.length > 0;

  const debouncedQuery = useDebounce(query.trim(), 500);

  const search = api.gifs.tenor.search.useInfiniteQuery(
    {
      query: debouncedQuery,
      locale: langTag,
    },
    {
      enabled: isSearching,
      placeholderData: keepPreviousData,
      getNextPageParam: (lastPage) => lastPage.next,
    },
  );

  const trendingTerms = api.gifs.tenor.trendingTerms.useQuery({
    locale: langTag,
  });

  const gifQuery = isSearching ? search : featured;

  const { handleRefresh, refreshing, tintColor } = useUserRefresh(
    gifQuery.refetch,
  );

  if (focused && !isSearching) {
    if (trendingTerms.data) {
      return (
        <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
          <Stack.Screen options={{ headerSearchBarOptions }} />
          <ScrollView
            contentInsetAdjustmentBehavior="automatic"
            className="px-4"
          >
            {trendingTerms.data.results.slice(0, 6).map((term, i) => (
              <Animated.View
                className="flex-1"
                key={term}
                entering={FadeInUp.delay(i * 100)}
              >
                <TouchableOpacity
                  onPress={() => {
                    setQuery(term);
                    ref.current?.setText(term);
                    ref.current?.blur();
                  }}
                  className="w-full flex-1 border-b px-2 py-3"
                  style={{ borderColor: theme.colors.border }}
                >
                  <Text className="text-lg">{term}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </ScrollView>
        </View>
      );
    }

    return (
      <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
        <Stack.Screen options={{ headerSearchBarOptions }} />
        <QueryWithoutData query={trendingTerms} />
      </View>
    );
  }

  if (gifQuery.data) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
        <Stack.Screen options={{ headerSearchBarOptions }} />
        <FlashList
          masonry
          data={gifQuery.data.pages.flatMap((page) => page.results)}
          contentInsetAdjustmentBehavior="automatic"
          numColumns={2}
          overrideItemLayout={(layout) => {
            layout.span = (width - 16) / 2;
          }}
          onEndReachedThreshold={2}
          onEndReached={() => gifQuery.fetchNextPage()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={tintColor}
            />
          }
          ListFooterComponent={<ListFooterComponent query={gifQuery} />}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: Platform.select({ ios: 0, default: 16 }),
          }}
          optimizeItemArrangement
          renderItem={({ item }) => <Gif item={item} />}
          drawDistance={0}
        />
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <Stack.Screen options={{ headerSearchBarOptions }} />
      <QueryWithoutData query={gifQuery} />
    </View>
  );
}

interface GifProps {
  item: TenorResponse;
}

const Gif = ({ item }: GifProps) => {
  const router = useRouter();
  const haptics = useHaptics();
  const agent = useAgent();
  const { showLinkOptions } = useLinkPress();
  const [, setComposerState] = useComposerState();
  const { _ } = useLingui();

  const selectGif = api.gifs.select.useMutation();

  const select = useMutation({
    mutationKey: ["select-gif", item.id],
    onMutate: () => haptics.impact(),
    mutationFn: async () => {
      const gif = await selectGif.mutateAsync({
        id: item.id,
        previewUrl: item.media_formats.gifpreview.url,
        description: item.content_description,
      });
      // upload the thumbnail to the user's own PDS
      const thumb = await uploadBlob(
        agent,
        `data:${gif.thumb.mimeType};base64,${gif.thumb.data}`,
        gif.thumb.mimeType,
      );
      return { gif, thumb };
    },
    onSuccess: ({ gif, thumb }) => {
      setComposerState(
        produce((draft) => {
          draft.gif = {
            view: {
              $type: "app.bsky.embed.external#view",
              external: {
                $type: "app.bsky.embed.external#viewExternal",
                uri: gif.uri,
                title: gif.title,
                description: gif.description,
              },
            },
            main: {
              $type: "app.bsky.embed.external",
              external: {
                $type: "app.bsky.embed.external#external",
                uri: gif.uri,
                title: gif.title,
                description: gif.description,
                thumb,
              },
            },
          };
        }),
      );
      router.navigate("../");
    },
    onError: (err) => {
      Sentry.captureException(err);
      toast.warning(_(msg`Could not select GIF`), {
        description: _(msg`Please try again`),
      });
    },
  });

  const aspectRatio =
    item.media_formats.tinymp4.dims[0]! / item.media_formats.tinymp4.dims[1]!;

  return (
    <View className="mb-2 flex-1 px-1">
      <TouchableHighlight
        className="relative w-full flex-1 rounded-lg"
        disabled={select.isPending}
        onPress={() => select.mutate()}
        onLongPress={() => showLinkOptions(item.url)}
        style={{ aspectRatio }}
      >
        <GifPreview
          key={item.media_formats.tinymp4.url}
          uri={item.media_formats.tinymp4.url}
          description={item.content_description}
        />
      </TouchableHighlight>
    </View>
  );
};

const GifPreview = ({
  uri,
  description,
}: {
  uri: string;
  description: string;
}) => {
  const player = useVideoPlayer(uri, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  return (
    <VideoView
      player={player}
      accessibilityLabel={description}
      pointerEvents="none"
      nativeControls={false}
      contentFit="cover"
      className="w-full flex-1 rounded-lg bg-neutral-50 dark:bg-neutral-950"
    />
  );
};
