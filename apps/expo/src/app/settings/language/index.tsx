import { Text, View } from "react-native";

import { GroupedList } from "~/components/grouped-list";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { LANGUAGES } from "~/lib/utils/locale/languages";

export default function LanguageSettings() {
  const [{ primaryLanguage, contentLanguages }] = useAppPreferences();

  const primaryLanguageLabel =
    LANGUAGES.find((lang) => lang.code2 === primaryLanguage)?.name ??
    primaryLanguage;

  return (
    <GroupedList
      groups={[
        {
          children: <View className="h-2" />,
          options: [
            {
              title: "Primary language",
              href: "/settings/language/primary",
              chevron: true,
              action: (
                <Text className="text-base text-neutral-500">
                  {primaryLanguageLabel}
                </Text>
              ),
            },
          ],
          footer:
            "This is the language that posts will be translated into, if they're not in your content languages. Temporarily, this is also the language that your posts will be marked as - this will change in the future.",
        },
        {
          options: [
            {
              title: "Content languages",
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
          footer: "Posts in these languages will not be translated.",
        },
      ]}
    />
  );
}
