import { Switch } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";

import { AccentColourSelect } from "~/components/accent-colour-select";
import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useIsPro } from "~/lib/purchases";
import {
  useSetAppPreferences,
  useTranslationMethod,
} from "~/lib/storage/app-preferences";

export default function ProSettings() {
  const translationMethod = useTranslationMethod();
  const setAppPreferences = useSetAppPreferences();
  const isPro = useIsPro();
  const router = useRouter();
  const { _ } = useLingui();

  if (!isPro) router.back();

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: _(msg`Translation provider`),
            options: [
              {
                title: _(msg`Use DeepL for translations`),
                disabled: !isPro,
                action: (
                  <Switch
                    value={translationMethod === "DEEPL"}
                    onValueChange={(useDeepL) => {
                      setAppPreferences({
                        translationMethod: useDeepL ? "DEEPL" : "GOOGLE",
                      });
                    }}
                    accessibilityHint={_(
                      msg`Use DeepL for translations instead of Google Translate`,
                    )}
                  />
                ),
              },
            ],
            footer: _(msg`Google Translate is used otherwise.`),
          },
          {
            title: _(msg`Accent colour`),
            children: <AccentColourSelect />,
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
