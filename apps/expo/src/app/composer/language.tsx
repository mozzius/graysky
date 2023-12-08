import { useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { SELECTABLE_LANGUAGES } from "~/lib/utils/locale/languages";

export default function PostLanguage() {
  const { langs, gif } = useLocalSearchParams<{ langs: string; gif: string }>();
  const [{ primaryLanguage, contentLanguages }] = useAppPreferences();
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: "Search languages",
    onChangeText: (evt) => setQuery(evt.nativeEvent.text),
  });

  const selected = langs?.split(",") ?? [primaryLanguage];

  const suggestedLangs = Array.from(
    new Set([primaryLanguage, ...contentLanguages, ...selected]),
  );

  const selectLanguage = (lang: string) => {
    if (gif) {
      router.push(`./?gif=${encodeURIComponent(gif)}&langs=${lang}`);
    } else {
      router.push(`./?langs=${lang}`);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerSearchBarOptions }} />
      <TransparentHeaderUntilScrolled>
        <GroupedList
          groups={
            query
              ? [
                  {
                    options: SELECTABLE_LANGUAGES.filter(
                      (l) =>
                        Boolean(l.code2) &&
                        l.name
                          .toLocaleLowerCase()
                          .includes(query.toLocaleLowerCase()),
                    ).map((lang) => ({
                      title: lang.name,
                      onPress: () => selectLanguage(lang.code2),
                      action: selected.includes(lang.code2) ? (
                        <CheckIcon color={theme.colors.primary} size={20} />
                      ) : null,
                    })),
                  },
                ]
              : [
                  {
                    title: "My languages",
                    options: SELECTABLE_LANGUAGES.filter(
                      (l) =>
                        Boolean(l.code2) && suggestedLangs.includes(l.code2),
                    ).map((lang) => ({
                      title: lang.name,
                      onPress: () => selectLanguage(lang.code2),
                      action: selected.includes(lang.code2) ? (
                        <CheckIcon color={theme.colors.primary} size={20} />
                      ) : null,
                    })),
                  },
                  {
                    title: "All languages",
                    options: SELECTABLE_LANGUAGES.filter((l) =>
                      Boolean(l.code2),
                    ).map((lang) => ({
                      title: lang.name,
                      onPress: () => selectLanguage(lang.code2),
                      action: selected.includes(lang.code2) ? (
                        <CheckIcon color={theme.colors.primary} size={20} />
                      ) : null,
                    })),
                  },
                ]
          }
        />
      </TransparentHeaderUntilScrolled>
    </>
  );
}
