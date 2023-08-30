import { Alert, Switch } from "react-native";
import { useTheme } from "@react-navigation/native";

import { GroupedList } from "../../components/grouped-list";
import { useAppPreferences } from "../../lib/hooks/preferences";

export default function AppSettings() {
  const [appPrefs, setAppPrefs] = useAppPreferences();
  const theme = useTheme();

  return (
    <GroupedList
      groups={[
        {
          title: "General",
          options: [
            {
              title: "Manually sort non-favourite feeds",
              action: (
                <Switch
                  value={appPrefs.sortableFeeds}
                  onValueChange={(sortableFeeds) =>
                    setAppPrefs({ sortableFeeds })
                  }
                  trackColor={{ true: theme.colors.primary }}
                  accessibilityLabel="Allows you to manually sort non-favourite feeds in the feeds tab"
                />
              ),
            },
            {
              title: "Group notifications together",
              action: (
                <Switch
                  value={appPrefs.groupNotifications}
                  onValueChange={(groupNotifications) =>
                    setAppPrefs({ groupNotifications })
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
              title: "Disable haptics",
              action: (
                <Switch
                  value={!appPrefs.haptics}
                  onValueChange={(disableHaptics) => {
                    const haptics = !disableHaptics;
                    setAppPrefs({ haptics });
                    if (!haptics) {
                      Alert.alert(
                        "Haptics disabled",
                        "The app won't trigger haptic feedback manually anymore, however some UI elements (such as the switch you just pressed) will still have haptics. If you are sensitive to this, please disable haptics in your device's system accessibility settings.",
                      );
                    }
                  }}
                  trackColor={{ true: theme.colors.primary }}
                  accessibilityLabel="Disable haptics (vibrations)"
                />
              ),
            },
            {
              title: "Reduce motion (coming soon)",
              action: (
                <Switch
                  value={false}
                  trackColor={{ true: theme.colors.primary }}
                  disabled
                />
              ),
            },
          ],
        },
      ]}
    />
  );
}
