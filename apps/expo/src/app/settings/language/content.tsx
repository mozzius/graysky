import { useTheme } from "@react-navigation/native";
import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { LANGUAGES } from "~/lib/utils/locale/languages";

export default function ContentLanguageSettings() {
  const [{ primaryLanguage, contentLanguages }, setAppPrefs] =
    useAppPreferences();
  const theme = useTheme();

  return (
    <GroupedList
      groups={[
        {
          options: LANGUAGES.filter((l) => Boolean(l.code2)).map((lang) => ({
            title: lang.name,
            onPress: () => {
              if (lang.code2 === primaryLanguage) return;
              setAppPrefs({
                contentLanguages: contentLanguages.includes(lang.code2)
                  ? contentLanguages.filter((l) => l !== lang.code2)
                  : [...contentLanguages, lang.code2],
              });
            },
            action:
              contentLanguages.includes(lang.code2) ||
              lang.code2 === primaryLanguage ? (
                <CheckIcon color={theme.colors.primary} size={20} />
              ) : null,
          })),
        },
      ]}
    />
  );
}
