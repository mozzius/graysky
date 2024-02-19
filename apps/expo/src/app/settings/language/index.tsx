import { TouchableOpacity } from "react-native";
import { Switch } from "react-native-gesture-handler";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { ChevronsUpDownIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { languageCodeToName } from "~/i18n/config";
import { useIsPro } from "~/lib/purchases";
import {
  useAppLanguage,
  useContentLanguages,
  usePrimaryLanguage,
  useSetAppPreferences,
  useTranslationMethod,
} from "~/lib/storage/app-preferences";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { LANGUAGES } from "~/lib/utils/locale/languages";

export default function LanguageSettings() {
  const primaryLanguage = usePrimaryLanguage();
  const contentLanguages = useContentLanguages();
  const translationMethod = useTranslationMethod();
  const appLanguage = useAppLanguage();
  const theme = useTheme();
  const setAppPreferences = useSetAppPreferences();
  const isPro = useIsPro();
  const { showActionSheetWithOptions } = useActionSheet();
  const { _ } = useLingui();

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
                  <TouchableOpacity
                    onPress={() => {
                      const options = ["en", "ja"] as const;
                      showActionSheetWithOptions(
                        {
                          options: [
                            ...options.map(languageCodeToName),
                            _(msg`Cancel`),
                          ],
                          cancelButtonIndex: options.length,
                          ...actionSheetStyles(theme),
                        },
                        (index) => {
                          if (index === undefined || !options[index]) return;
                          setAppPreferences({
                            appLanguage: options[index],
                          });
                        },
                      );
                    }}
                    className="flex-row items-center"
                  >
                    <Text primary className="text-base font-medium capitalize">
                      {languageCodeToName(appLanguage)}
                    </Text>
                    <ChevronsUpDownIcon
                      size={16}
                      color={theme.colors.primary}
                      className="ml-1"
                    />
                  </TouchableOpacity>
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
                  <Text className="text-base text-neutral-500">
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
