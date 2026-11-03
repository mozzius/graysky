import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Form } from "~/components/form";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { languageCodeToName } from "~/i18n/config";
import { useIsPro } from "~/lib/purchases";
import {
  availableAppLanguages,
  useAppLanguage,
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
  const appLanguage = useAppLanguage();

  const setAppPreferences = useSetAppPreferences();
  const isPro = useIsPro();

  const { _ } = useLingui();

  const translationService = isPro ? translationMethod : "GOOGLE";

  const primaryLanguageLabel =
    LANGUAGES.find((lang) => lang.code2 === primaryLanguage)?.name ??
    primaryLanguage;

  return (
    <TransparentHeaderUntilScrolled>
      <Form
        sections={[
          {
            title: _(msg`App language`),
            rows: [
              {
                type: "picker",
                title: _(msg`App language`),
                value: appLanguage,
                options: availableAppLanguages.map((lang) => ({
                  value: lang,
                  label: languageCodeToName(lang),
                })),
                onValueChange: (lang) =>
                  setAppPreferences({
                    appLanguage: lang as (typeof availableAppLanguages)[number],
                  }),
              },
            ],
          },
          {
            title: _(msg`Post languages`),
            rows: [
              {
                title: _(msg`Primary language`),
                href: "/settings/language/primary",
                value: primaryLanguageLabel,
              },
            ],
            footer: _(
              msg`Posts will be translated into ${primaryLanguageLabel}.`,
            ),
          },
          {
            rows: [
              {
                title: _(msg`My languages`),
                href: "/settings/language/content",
                value:
                  contentLanguages.length > 2
                    ? String(contentLanguages.length)
                    : contentLanguages
                        .map(
                          (contentLang) =>
                            LANGUAGES.find((lang) => lang.code2 === contentLang)
                              ?.name ?? contentLang,
                        )
                        .join(", "),
              },
            ],
            footer: _(
              msg`If a post is marked as being in one of these languages, it will not be translated.`,
            ),
          },
          {
            title: _(msg`Translation provider`),
            rows: [
              {
                type: "toggle",
                title: _(msg`Use DeepL for translations`),
                disabled: !isPro,
                value: translationService === "DEEPL",
                onValueChange: (useDeepL) => {
                  setAppPreferences({
                    translationMethod: useDeepL ? "DEEPL" : "GOOGLE",
                  });
                },
                accessibilityHint: _(
                  msg`Use DeepL for translations instead of Google Translate`,
                ),
              },
            ],
            footer: isPro
              ? _(msg`Google Translate is used otherwise.`)
              : _(
                  msg`Get Graysky Pro for access to DeepL translations. Google Translate is used otherwise.`,
                ),
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
