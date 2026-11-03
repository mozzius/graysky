import { useState } from "react";
import { Stack, useRouter } from "expo-router";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Form } from "~/components/form";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useSearchBarOptions } from "~/lib/hooks/search-bar";
import {
  useContentLanguages,
  usePrimaryLanguage,
  useSetAppPreferences,
} from "~/lib/storage/app-preferences";
import { SELECTABLE_LANGUAGES } from "~/lib/utils/locale/languages";

export default function PrimaryLanguageSettings() {
  const primaryLanguage = usePrimaryLanguage();
  const contentLanguages = useContentLanguages();
  const setAppPreferences = useSetAppPreferences();
  const router = useRouter();
  const { _ } = useLingui();

  const [query, setQuery] = useState("");
  const headerSearchBarOptions = useSearchBarOptions({
    placeholder: _(msg`Search languages`),
    onChangeText: (evt) => setQuery(evt.nativeEvent.text),
    hideWhenScrolling: false,
  });

  return (
    <>
      <Stack.Screen options={{ headerSearchBarOptions }} />
      <TransparentHeaderUntilScrolled>
        <Form
          sections={[
            {
              rows: SELECTABLE_LANGUAGES.filter((l) =>
                Boolean(l.code2) && query
                  ? l.name
                      .toLocaleLowerCase()
                      .includes(query.toLocaleLowerCase())
                  : true,
              ).map((lang) => ({
                title: lang.name,
                onPress: () => {
                  setAppPreferences({
                    primaryLanguage: lang.code2,
                    contentLanguages: contentLanguages.includes(lang.code2)
                      ? contentLanguages
                      : [...contentLanguages, lang.code2],
                  });
                  router.back();
                },
                selected: lang.code2 === primaryLanguage,
              })),
            },
          ]}
        />
      </TransparentHeaderUntilScrolled>
    </>
  );
}
