import { useRef, useState } from "react";
import { ActivityIndicator, TouchableHighlight, View } from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";
import { type SearchBarCommands } from "react-native-screens";
import { ResizeMode, Video } from "expo-av";
import { Stack, useRouter } from "expo-router";
import { MasonryFlashList } from "@shopify/flash-list";

import { type TenorResponse } from "@graysky/api/src/router/gifs";

import { QueryWithoutData } from "~/components/query-without-data";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { locale } from "~/lib/locale";
import { api } from "~/lib/utils/api";
import { cx } from "~/lib/utils/cx";

export default function GifSearch() {
  const ref = useRef<SearchBarCommands>(null);
  const [_search, setSearch] = useState("");
  const [_focused, setFocused] = useState(false);
  const { width } = useSafeAreaFrame();

  const headerSearchBarOptions = useSearchBarOptions({
    ref,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    onCancelButtonPress: () => {
      setSearch("");
      ref.current?.blur();
    },
    placeholder: "Search Tenor",
    hideWhenScrolling: false,
  });

  const featured = api.gifs.tenor.featured.useInfiniteQuery(
    {
      locale: locale.languageTag.includes("-")
        ? locale.languageTag.replace("-", "_")
        : undefined,
    },
    { getNextPageParam: (lastPage) => lastPage.next },
  );

  if (featured.data) {
    return (
      <>
        <Stack.Screen options={{ headerSearchBarOptions }} />
        <MasonryFlashList
          data={featured.data.pages.flatMap((page) => page.results)}
          contentInsetAdjustmentBehavior="automatic"
          numColumns={2}
          overrideItemLayout={(layout, item) => {
            const aspectRatio =
              item.media_formats.tinymp4.dims[0]! /
              item.media_formats.tinymp4.dims[1]!;
            layout.span = (width - 16) / 2;
            layout.size = (layout.span - 4) / aspectRatio + 8;
          }}
          onEndReached={() => featured.fetchNextPage()}
          estimatedItemSize={200}
          ListFooterComponent={
            featured.isFetching ? (
              <View className="w-full items-center py-4">
                <ActivityIndicator size="small" />
              </View>
            ) : (
              <View className="h-20" />
            )
          }
          contentContainerStyle={{ paddingHorizontal: 16 }}
          optimizeItemArrangement
          renderItem={({ item, columnIndex }) => (
            <Gif item={item} column={columnIndex} />
          )}
          drawDistance={0}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions,
        }}
      />
      <QueryWithoutData query={featured} />
    </>
  );
}

interface GifProps {
  item: TenorResponse;
  column: number;
}

const Gif = ({ item, column }: GifProps) => {
  const router = useRouter();

  const aspectRatio =
    item.media_formats.tinymp4.dims[0]! / item.media_formats.tinymp4.dims[1]!;

  return (
    <View className={cx("mb-2 flex-1", column === 0 ? "pr-1" : "pl-1")}>
      <TouchableHighlight
        className="relative w-full flex-1 rounded-lg"
        onPress={() => router.push("../")}
        style={{ aspectRatio }}
      >
        <Video
          accessibilityLabel={item.content_description}
          key={item.media_formats.tinymp4.url}
          source={{ uri: item.media_formats.tinymp4.url }}
          pointerEvents="none"
          className="w-full flex-1 rounded-lg bg-neutral-50 dark:bg-neutral-950"
          resizeMode={ResizeMode.COVER}
          isMuted
          isLooping
          shouldPlay
        />
      </TouchableHighlight>
    </View>
  );
};
