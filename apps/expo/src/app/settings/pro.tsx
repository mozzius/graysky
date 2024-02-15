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
            title: "翻訳プロバイダー",
            options: [
              {
                title: "DeepL翻訳を使用",
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
            footer: "それ以外は、Google翻訳を使用します",
          },
          {
            title: "アクセントカラー",
            children: <AccentColourSelect />,
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
