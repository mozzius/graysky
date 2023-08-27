import { Alert, Switch } from "react-native";
import { useTheme } from "@react-navigation/native";

import { GroupedList } from "../../components/grouped-list";
import { useAppPreferences } from "../../lib/hooks/preferences";

export default function AppSettings() {
  const { appPrefs, setAppPrefs } = useAppPreferences();
  const theme = useTheme();

  if (!appPrefs.data) return null;

  return (
    <GroupedList
      groups={[
        {
          title: "General",
          options: [
            {
              title: "Group notifications together",
              action: (
                <Switch
                  value={appPrefs.data.groupNotifications}
                  onValueChange={(groupNotifications) =>
                    setAppPrefs.mutate({ groupNotifications })
                  }
                  trackColor={{ true: theme.colors.primary }}
                  accessibilityLabel="Group notifications together in the notification tab"
                />
              ),
            },
          ],
        },
        {
          title: "Accessibility",
          options: [
            {
              title: "Enable haptics",
              action: (
                <Switch
                  value={appPrefs.data.haptics}
                  onValueChange={(haptics) => {
                    setAppPrefs.mutate({ haptics });
                    if (!haptics) {
                      Alert.alert(
                        "Haptics disabled",
                        "The app won't trigger haptic feedback manually anymore, however some UI elements (such as the switch you just pressed) will still have haptics. If you are sensitive to this, please disable haptics in your device's system accessibility settings.",
                      );
                    }
                  }}
                  trackColor={{ true: theme.colors.primary }}
                  accessibilityLabel="Enable haptics (vibrations)"
                />
              ),
            },
          ],
        },
      ]}
    />
  );
}
