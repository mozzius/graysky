import { Switch } from "react-native-gesture-handler";
import { useRouter } from "expo-router";

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

  if (!isPro) router.back();

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: "Translation provider",
            options: [
              {
                title: "Use DeepL for translations",
                disabled: !isPro,
                action: (
                  <Switch
                    value={translationMethod === "DEEPL"}
                    onValueChange={(useDeepL) => {
                      setAppPreferences({
                        translationMethod: useDeepL ? "DEEPL" : "GOOGLE",
                      });
                    }}
                    accessibilityHint="Use DeepL for translations instead of Google Translate"
                  />
                ),
              },
            ],
            footer: "Google Translate is used otherwise.",
          },
          {
            title: "Accent color",
            children: <AccentColourSelect />,
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
