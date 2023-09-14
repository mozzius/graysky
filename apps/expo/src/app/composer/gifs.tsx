import { useRef, useState } from "react";
import { TouchableHighlight } from "react-native";
import { useSafeAreaFrame } from "react-native-safe-area-context";
import { type SearchBarCommands } from "react-native-screens";
import { Video } from "expo-av";
import { Stack, useRouter } from "expo-router";
import { MasonryFlashList } from "@shopify/flash-list";

import { QueryWithoutData } from "~/components/query-without-data";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { locale as localeObj } from "~/lib/locale";
import { api } from "~/lib/utils/api";

const locale = localeObj.languageTag.replace("-", "_");

export default function GifSearch() {
  const ref = useRef<SearchBarCommands>(null);
  const [_search, setSearch] = useState("");
  const [_focused, setFocused] = useState(false);
  const { width } = useSafeAreaFrame();
  const router = useRouter();

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
  });

  const featured = api.gifs.featured.useInfiniteQuery(
    { locale },
    { getNextPageParam: (lastPage) => lastPage.next },
  );

  if (featured.data) {
    return (
      <>
        <Stack.Screen
          options={{
            headerSearchBarOptions,
          }}
        />
        <MasonryFlashList
          data={featured.data.pages.flatMap((page) => page.results)}
          contentInsetAdjustmentBehavior="automatic"
          key={2}
          overrideItemLayout={(layout, item) => {
            const aspectRatio =
              item.media_formats.tinymp4.dims[0]! /
              item.media_formats.tinymp4.dims[1]!;
            layout.size = width / 2 / aspectRatio;
          }}
          optimizeItemArrangement
          renderItem={({ item }) => (
            <TouchableHighlight
              className="flex-1"
              onPress={() => router.push("../")}
            >
              <Video
                source={{ uri: item.media_formats.tinymp4.url }}
                className="flex-1"
                style={{
                  aspectRatio:
                    item.media_formats.tinymp4.dims[0]! /
                    item.media_formats.tinymp4.dims[1]!,
                }}
              />
            </TouchableHighlight>
          )}
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
