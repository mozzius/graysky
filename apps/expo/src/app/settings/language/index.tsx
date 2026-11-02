import { View } from "react-native";
import { Switch } from "react-native-gesture-handler";
import { useTheme } from "expo-router/react-navigation";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { ChevronsUpDownIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { Menu } from "~/components/menu";
import { Text } from "~/components/themed/text";
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
  const theme = useTheme();

  const translationService = isPro ? translationMethod : "GOOGLE";

  const primaryLanguageLabel =
    LANGUAGES.find((lang) => lang.code2 === primaryLanguage)?.name ??
    primaryLanguage;

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: _(msg`App language`),
            options: [
              {
                title: _(msg`App language`),
                action: (
                  <Menu
                    groups={[
                      {
                        key: "languages",
                        items: availableAppLanguages.map((lang) => ({
                          type: "toggle",
                          key: lang,
                          label: languageCodeToName(lang),
                          checked: appLanguage === lang,
                          onCheckedChange: (checked) =>
                            checked && setAppPreferences({ appLanguage: lang }),
                        })),
                      },
                    ]}
                  >
                    <View className="flex-row items-center gap-x-1">
                      <Text primary className="text-base font-medium">
                        {languageCodeToName(appLanguage)}
                      </Text>
                      <ChevronsUpDownIcon
                        size={16}
                        color={theme.colors.primary}
                      />
                    </View>
                  </Menu>
                ),
              },
            ],
          },
          {
            title: _(msg`Post languages`),
            options: [
              {
                title: _(msg`Primary language`),
                href: "/settings/language/primary",
                chevron: true,
                action: (
                  <Text
                    className="text-base text-neutral-500"
                    numberOfLines={1}
                  >
                    {primaryLanguageLabel}
                  </Text>
                ),
              },
            ],
            footer: _(
              msg`Posts will be translated into ${primaryLanguageLabel}.`,
            ),
          },
          {
            options: [
              {
                title: _(msg`My languages`),
                href: "/settings/language/content",
                chevron: true,
                action: (
                  <Text
                    className="text-base text-neutral-500"
                    numberOfLines={1}
                  >
                    {contentLanguages.length > 2
                      ? contentLanguages.length
                      : contentLanguages
                          .map(
                            (contentLang) =>
                              LANGUAGES.find(
                                (lang) => lang.code2 === contentLang,
                              )?.name ?? contentLang,
                          )
                          .join(", ")}
                  </Text>
                ),
              },
            ],
            footer: _(
              msg`If a post is marked as being in one of these languages, it will not be translated.`,
            ),
          },
          {
            title: _(msg`Translation provider`),
            options: [
              {
                title: _(msg`Use DeepL for translations`),
                disabled: !isPro,
                action: (
                  <Switch
                    value={translationService === "DEEPL"}
                    disabled={!isPro}
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
