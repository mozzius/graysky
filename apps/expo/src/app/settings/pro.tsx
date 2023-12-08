import { TouchableOpacity, View } from "react-native";
import { Switch } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { CheckIcon } from "lucide-react-native";
import colors from "tailwindcss/colors";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { useIsPro } from "~/lib/purchases";

export default function ProSettings() {
  const [{ translationMethod, accentColor }, setAppPrefs] = useAppPreferences();
  const isPro = useIsPro();
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
              <View className="space-between flex-row px-4 py-1.5">
                {[
                  undefined,
                  colors.green[500],
                  colors.amber[500],
                  colors.emerald[500],
                  colors.fuchsia[500],
                  colors.teal[500],
                  colors.red[500],
                ].map((color) => (
                  <TouchableOpacity
                    key={color ?? "default"}
                    onPress={() => setAppPrefs({ accentColor: color })}
                  >
                    <View
                      key={color}
                      className="h-10 w-10 items-center justify-center rounded-full"
                      style={{ backgroundColor: color }}
                    >
                      {accentColor === color && (
                        <CheckIcon size={16} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ),
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
