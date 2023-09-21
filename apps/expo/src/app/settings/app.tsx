import {
  ActivityIndicator,
  Alert,
  Switch,
  TouchableOpacity,
} from "react-native";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { CircleDotIcon, CloudIcon, CloudyIcon } from "lucide-react-native";

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
              title: "Home screen layout",
              action: (
                <TouchableOpacity
                  onPress={() => {
                    const options = ["Feeds list", "A specific feed"];
                    const icons = [
                      <CloudyIcon
                        size={24}
                        color={theme.colors.text}
                        key={0}
                      />,
                      <CloudIcon size={24} color={theme.colors.text} key={1} />,
                      <></>,
                    ];
                    showActionSheetWithOptions(
                      {
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
                        switch (index) {
                          case 0:
                            setAppPrefs({ homepage: "feeds" });
                            break;
                          case 1:
                            setAppPrefs({ homepage: "skyline" });
                            break;
                        }
                      },
                    );
                  }}
                >
                  <Text
                    style={{ color: theme.colors.primary }}
                    className="text-base font-medium capitalize"
                  >
                    {appPrefs.homepage === "feeds" ? "Feeds list" : "Feed"}
                  </Text>
                </TouchableOpacity>
              ),
            },
            ...(appPrefs.homepage === "skyline"
              ? [
                  {
                    title: "Primary feed",
                    action: (
                      <TouchableOpacity
                        disabled={savedFeeds.isLoading}
                        onPress={() => {
                          const data = savedFeeds.data
                            ? savedFeeds.data.pinned.map(
                                (pin) =>
                                  savedFeeds.data.feeds.find(
                                    (f) => f.uri === pin,
                                  )!,
                              )
                            : [];

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
              title: "Show each notification individually",
              action: (
                <Switch
                  value={!appPrefs.groupNotifications}
                  onValueChange={(value) =>
                    setAppPrefs({ groupNotifications: !value })
                  }
                  accessibilityLabel="Show each notification individually in the notification tab"
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
