import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { LANGUAGES } from "~/lib/utils/locale/languages";

export default function PrimaryLanguageSettings() {
  const [{ primaryLanguage, contentLanguages }, setAppPrefs] =
    useAppPreferences();
  const theme = useTheme();
  const router = useRouter();

  return (
    <GroupedList
      groups={[
        {
          options: LANGUAGES.filter((l) => Boolean(l.code2)).map((lang) => ({
            title: lang.name,
            onPress: () => {
              setAppPrefs({
                primaryLanguage: lang.code2,
                contentLanguages: contentLanguages.includes(lang.code2)
                  ? contentLanguages
                  : [...contentLanguages, lang.code2],
              });
              router.back();
            },
            action:
              lang.code2 === primaryLanguage ? (
                <CheckIcon color={theme.colors.primary} size={20} />
              ) : null,
          })),
        },
      ]}
    />
  );
}
