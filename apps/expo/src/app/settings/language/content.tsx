import { useState } from "react";
import { Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { SELECTABLE_LANGUAGES } from "~/lib/utils/locale/languages";

export default function ContentLanguageSettings() {
  const [{ primaryLanguage, contentLanguages }, setAppPrefs] =
    useAppPreferences();
  const theme = useTheme();

  const [query, setQuery] = useState("");
  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: "Search languages",
    onChangeText: (evt) => setQuery(evt.nativeEvent.text),
  });

  return (
    <>
      <Stack.Screen options={{ headerSearchBarOptions }} />
      <TransparentHeaderUntilScrolled>
        <GroupedList
          groups={[
            {
              options: SELECTABLE_LANGUAGES.filter((l) =>
                Boolean(l.code2) && query
                  ? l.name
                      .toLocaleLowerCase()
                      .includes(query.toLocaleLowerCase())
                  : true,
              ).map((lang) => ({
                title: lang.name,
                onPress: () => {
                  if (lang.code2 === primaryLanguage) return;
                  setTimeout(() => {
                    setAppPrefs({
                      contentLanguages: contentLanguages.includes(lang.code2)
                        ? contentLanguages.filter((l) => l !== lang.code2)
                        : [...contentLanguages, lang.code2],
                    });
                  });
                },
                action:
                  contentLanguages.includes(lang.code2) ||
                  lang.code2 === primaryLanguage ? (
                    <CheckIcon color={theme.colors.primary} size={20} />
                  ) : null,
              })),
            },
          ]}
        />
      </TransparentHeaderUntilScrolled>
    </>
  );
}
