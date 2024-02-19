import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useComposerState } from "~/lib/composer/state";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import {
  useContentLanguages,
  useMostRecentLanguage,
  usePrimaryLanguage,
  useSetAppPreferences,
} from "~/lib/storage/app-preferences";
import { SELECTABLE_LANGUAGES } from "~/lib/utils/locale/languages";
import { produce } from "~/lib/utils/produce";

export default function PostLanguage() {
  const { _ } = useLingui();
  const primaryLanguage = usePrimaryLanguage();
  const mostRecentLanguage = useMostRecentLanguage();
  const contentLanguages = useContentLanguages();
  const setAppPreferences = useSetAppPreferences();

  const theme = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: _(msg`Search languages`),
    onChangeText: (evt) => setQuery(evt.nativeEvent.text),
    hideWhenScrolling: false,
  });
  const [{ languages }, setComposerState] = useComposerState();

  const selected = languages ?? [mostRecentLanguage ?? primaryLanguage];

  const suggestedLangs = Array.from(
    new Set([
      mostRecentLanguage,
      primaryLanguage,
      ...contentLanguages,
      ...selected,
    ]),
  );

  const selectLanguage = (lang: string) => {
    setAppPreferences({ mostRecentLanguage: lang });
    setComposerState(
      produce((draft) => {
        draft.languages = [lang];
      }),
    );
    router.navigate("./");
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
                    title: _(msg`My languages`),
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
                    title: _(msg`All languages`),
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
