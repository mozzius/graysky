import { ScrollView, TouchableOpacity, View } from "react-native";
import { Switch } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { DarkTheme, DefaultTheme, useTheme } from "@react-navigation/native";
import { CheckIcon } from "lucide-react-native";
import colors from "tailwindcss/colors";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { useIsPro } from "~/lib/purchases";

export default function ProSettings() {
  const [{ translationMethod, accentColor }, setAppPrefs] = useAppPreferences();
  const isPro = useIsPro();
  const theme = useTheme();
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
                      setAppPrefs({
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
            children: (
              <ScrollView
                horizontal
                className="space-between flex-1 flex-row gap-x-2 px-4 py-2"
              >
                {[
                  undefined,
                  colors.amber[500],
                  colors.red[500],
                  colors.purple[500],
                  colors.green[500],
                  colors.fuchsia[500],
                ].map((color) => (
                  <TouchableOpacity
                    key={color ?? "default"}
                    onPress={() => setAppPrefs({ accentColor: color })}
                  >
                    <View
                      key={color}
                      className="h-10 w-10 items-center justify-center rounded-full"
                      style={{
                        backgroundColor:
                          color ??
                          (theme.dark
                            ? DarkTheme.colors.primary
                            : DefaultTheme.colors.primary),
                      }}
                    >
                      {accentColor === color && (
                        <CheckIcon size={20} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ),
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
