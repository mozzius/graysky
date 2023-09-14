import { useRef, useState } from "react";
import { type SearchBarCommands } from "react-native-screens";
import { Stack } from "expo-router";

import { useSearchBarOptions } from "~/lib/hooks/search-bar";

export default function GifSearch() {
  const ref = useRef<SearchBarCommands>(null);
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);

  const headerSearchBarOptions = useSearchBarOptions({
    ref,
    onFocus: () => setFocused(true),
    onBlur: () => setFocused(false),
    onOpen: () => setOpen(true),
    onClose: () => setOpen(false),
    onChangeText: (evt) => setSearch(evt.nativeEvent.text),
    onCancelButtonPress: () => {
      setSearch("");
      ref.current?.blur();
    },
    placeholder: "Search Tenor",
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerSearchBarOptions,
        }}
      />
    </>
  );
}
