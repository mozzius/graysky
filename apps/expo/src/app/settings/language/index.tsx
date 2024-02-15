import { Text } from "react-native";
import { Switch } from "react-native-gesture-handler";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useIsPro } from "~/lib/purchases";
import {
  useContentLanguages,
  usePrimaryLanguage,
  useSetAppPreferences,
  useTranslationMethod,
} from "~/lib/storage/app-preferences";
import { LANGUAGES } from "~/lib/utils/locale/languages";

export default function LanguageSettings() {
  const primaryLanguage = usePrimaryLanguage();
  const contentLanguages = useContentLanguages();
  const translationMethod = useTranslationMethod();
  const setAppPreferences = useSetAppPreferences();
  const isPro = useIsPro();

  const translationService = isPro ? translationMethod : "GOOGLE";

  const primaryLanguageLabel =
    LANGUAGES.find((lang) => lang.code2 === primaryLanguage)?.name ??
    primaryLanguage;

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: "投稿の言語",
            options: [
              {
                title: "プライマリの言語",
                href: "/settings/language/primary",
                chevron: true,
                action: (
                  <Text className="text-base text-neutral-500">
                    {primaryLanguageLabel}
                  </Text>
                ),
              },
            ],
            footer: `投稿は${primaryLanguageLabel}に翻訳されます。`,
          },
          {
            options: [
              {
                title: "自分の言語",
                href: "/settings/language/content",
                chevron: true,
                action: (
                  <Text className="text-base text-neutral-500">
                    {contentLanguages
                      .map(
                        (contentLang) =>
                          LANGUAGES.find((lang) => lang.code2 === contentLang)
                            ?.name ?? contentLang,
                      )
                      .join(", ")}
                  </Text>
                ),
              },
            ],
            footer:
              "投稿がこれらの言語のいずれであるとマークされている場合、翻訳されません。",
          },
          {
            title: "翻訳プロバイダー",
            options: [
              {
                title: "DeepL翻訳を使用する",
                disabled: !isPro,
                action: (
                  <Switch
                    value={translationService === "DEEPL"}
                    onValueChange={(useDeepL) => {
                      setAppPreferences({
                        translationMethod: useDeepL ? "DEEPL" : "GOOGLE",
                      });
                    }}
                    accessibilityHint="Google翻訳の代わりにDeepL翻訳を翻訳に使用します"
                  />
                ),
              },
            ],
            footer: isPro
              ? "それ以外は、Google翻訳を使用します。"
              : "DeepL翻訳にアクセスするには、Graysky Proを入手してください。それ以外はGoogle翻訳を使用します。",
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
