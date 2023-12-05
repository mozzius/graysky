import { useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { CheckIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { SELECTABLE_LANGUAGES } from "~/lib/utils/locale/languages";

export default function PostLanguage() {
  const { langs } = useLocalSearchParams<{ langs: string }>();
  const [{ primaryLanguage, contentLanguages }] = useAppPreferences();
  const theme = useTheme();
  const router = useRouter();

  const selected = langs?.split(",") ?? [];

  const suggestedLangs = Array.from(
    new Set([primaryLanguage, ...contentLanguages, ...selected]),
  );

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: "My languages",
            options: SELECTABLE_LANGUAGES.filter(
              (l) => Boolean(l.code2) && suggestedLangs.includes(l.code2),
            ).map((lang) => ({
              title: lang.name,
              onPress: () => {
                router.push("./?langs=" + lang.code2);
              },
              action: selected.includes(lang.code2) ? (
                <CheckIcon color={theme.colors.primary} size={20} />
              ) : null,
            })),
          },
          {
            title: "All languages",
            options: SELECTABLE_LANGUAGES.filter((l) => Boolean(l.code2)).map(
              (lang) => ({
                title: lang.name,
                onPress: () => {
                  router.push("./?langs=" + lang.code2);
                },
                action: selected.includes(lang.code2) ? (
                  <CheckIcon color={theme.colors.primary} size={20} />
                ) : null,
              }),
            ),
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
