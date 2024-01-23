import { startTransition, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import { SELECTABLE_LANGUAGES } from "~/lib/utils/locale/languages";

export default function PostLanguage() {
  const { langs, ...searchParams } = useLocalSearchParams<{
    langs: string;
    gif: string;
    reply: string;
    quote: string;
  }>();
  const [
    { primaryLanguage, mostRecentLanguage, contentLanguages },
    setAppPrefs,
  ] = useAppPreferences();
  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: "Search languages",
    onChangeText: (evt) => setQuery(evt.nativeEvent.text),
  });

  const selected = langs?.split(",") ?? [mostRecentLanguage ?? primaryLanguage];

  const suggestedLangs = Array.from(
    new Set([
      mostRecentLanguage,
      primaryLanguage,
      ...contentLanguages,
      ...selected,
    ]),
  );

  const selectLanguage = (lang: string) => {
    startTransition(() => {
      setAppPrefs({
        mostRecentLanguage: lang,
      });
    });

    const search = new URLSearchParams();
    search.append("langs", lang);
    if (searchParams.reply) search.append("reply", searchParams.reply);
    if (searchParams.quote) search.append("quote", searchParams.quote);
    if (searchParams.gif) search.append("gif", searchParams.gif);
    router.navigate(`./?${search.toString()}`);
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
