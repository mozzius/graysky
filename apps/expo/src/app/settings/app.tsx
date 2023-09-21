import { Alert, Switch, TouchableOpacity } from "react-native";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";

import { GroupedList } from "~/components/grouped-list";
import { Text } from "~/components/text";
import { useSavedFeeds } from "~/lib/hooks";
import { useAppPreferences } from "~/lib/hooks/preferences";

export default function AppSettings() {
  const [appPrefs, setAppPrefs] = useAppPreferences();
  const { showActionSheetWithOptions } = useActionSheet();
  const theme = useTheme();
  const savedFeeds = useSavedFeeds();

  return (
    <GroupedList
      groups={[
        {
          title: "Home screen",
          options: [
            {
              title: "Show a specific feed on the home screen",
              action: (
                <Switch
                  value={appPrefs.homepage === "skyline"}
                  onValueChange={(value) =>
                    setAppPrefs({
                      homepage: value ? "skyline" : "feeds",
                    })
                  }
                  accessibilityLabel="Show a specific feed on the home screen, rather than the full list of feeds"
                />
              ),
            },
            ...(appPrefs.homepage === "skyline"
              ? [
                  {
                    title: "Home feed",
                    action: (
                      <TouchableOpacity
                        disabled={savedFeeds.isLoading}
                        onPress={() => {
                          const data = savedFeeds.data?.feeds ?? [];
                          const options = [
                            "Following",
                            ...data
                              .filter(
                                (x) => savedFeeds.data?.pinned?.includes(x.uri),
                              )
                              .map((x) => x.displayName),
                          ];
                          showActionSheetWithOptions(
                            {
                              title: "Select home feed",
                              options: [...options, "Cancel"],
                              cancelButtonIndex: options.length,
                              destructiveButtonIndex: 0,
                              userInterfaceStyle: theme.dark ? "dark" : "light",
                              textStyle: { color: theme.colors.text },
                              containerStyle: {
                                backgroundColor: theme.colors.card,
                              },
                            },
                            (index) => {
                              if (
                                index === undefined ||
                                index === options.length
                              )
                                return;
                              if (index === 0) {
                                setAppPrefs({ defaultFeed: "following" });
                                return;
                              }
                              setAppPrefs({
                                defaultFeed: data[index - 1]!.displayName,
                              });
                            },
                          );
                        }}
                      >
                        <Text
                          style={{
                            color: theme.colors.primary,
                          }}
                          className="text-base font-medium capitalize"
                        >
                          {appPrefs.defaultFeed}
                        </Text>
                      </TouchableOpacity>
                    ),
                  },
                ]
              : []),
          ],
        },
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
                  accessibilityLabel="Disable haptics (vibrations)"
                />
              ),
            },
            // {
            //   title: "Reduce motion (coming soon)",
            //   action: (
            //     <Switch
            //       value={false}
            //       trackColor={{ true: theme.colors.primary }}
            //       disabled
            //     />
            //   ),
            // },
          ],
        },
      ]}
    />
  );
}
