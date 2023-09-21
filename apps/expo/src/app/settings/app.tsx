import {
  ActivityIndicator,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { CircleDotIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { Text } from "~/components/text";
import { useSavedFeeds } from "~/lib/hooks";
import { useAppPreferences } from "~/lib/hooks/preferences";

export default function AppSettings() {
  const [appPrefs, setAppPrefs] = useAppPreferences();
  const { showActionSheetWithOptions } = useActionSheet();
  const theme = useTheme();
  const savedFeeds = useSavedFeeds();

  let defaultFeed = "Following";
  let unknown = false;

  if (appPrefs.defaultFeed !== "following") {
    const data = savedFeeds.data?.feeds ?? [];
    const feed = data.find((x) => x.uri === appPrefs.defaultFeed);
    if (feed) {
      defaultFeed = feed.displayName;
    } else {
      unknown = true;
    }
  }

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
                          const data = (savedFeeds.data?.feeds ?? []).filter(
                            (x) => savedFeeds.data?.pinned?.includes(x.uri),
                          );

                          const options = [
                            "Following",
                            ...data.map((x) => x.displayName),
                          ];
                          const icons = [
                            appPrefs.defaultFeed === "following" ? (
                              <CircleDotIcon
                                key={0}
                                color={theme.colors.text}
                                size={24}
                              />
                            ) : (
                              <></>
                            ),
                            data.map((x, i) =>
                              x.uri === appPrefs.defaultFeed ? (
                                <CircleDotIcon
                                  key={i + 1}
                                  color={theme.colors.text}
                                  size={24}
                                />
                              ) : (
                                <></>
                              ),
                            ),
                            <></>,
                          ];
                          showActionSheetWithOptions(
                            {
                              title: "Select home feed",
                              options: [...options, "Cancel"],
                              icons,
                              cancelButtonIndex: options.length,
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
                              } else {
                                setAppPrefs({
                                  defaultFeed: data[index - 1]!.uri,
                                });
                              }
                            },
                          );
                        }}
                      >
                        {savedFeeds.isSuccess ? (
                          <Text
                            style={{
                              color: unknown
                                ? theme.colors.notification
                                : theme.colors.primary,
                            }}
                            className="text-base font-medium"
                          >
                            {unknown ? "Unknown" : defaultFeed}
                          </Text>
                        ) : (
                          <ActivityIndicator />
                        )}
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
