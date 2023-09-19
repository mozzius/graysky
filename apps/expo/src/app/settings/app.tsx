import { Alert, Switch } from "react-native";

// import { useActionSheet } from "@expo/react-native-action-sheet";
// import { useTheme } from "@react-navigation/native";

import { GroupedList } from "~/components/grouped-list";
// import { Text } from "~/components/text";
// import { useSavedFeeds } from "~/lib/hooks";
import { useAppPreferences } from "~/lib/hooks/preferences";

export default function AppSettings() {
  const [appPrefs, setAppPrefs] = useAppPreferences();
  // const { showActionSheetWithOptions } = useActionSheet();
  // const theme = useTheme();
  // const savedFeeds = useSavedFeeds();

  return (
    <GroupedList
      groups={[
        // {
        //   title: "Home screen",
        //   options:
        //     appPrefs.homepage === "feeds"
        //       ? [
        //           {
        //             title: "Default feed",
        //             action: (
        //               <TouchableOpacity
        //                 disabled={savedFeeds.isLoading}
        //                 onPress={() => {
        //                   const data =
        //                     savedFeeds.data?.map((x) => x.name) ?? [];
        //                   const options = ["following", ...data];
        //                   showActionSheetWithOptions(
        //                     {
        //                       title: "Default feed",
        //                       options: [...options, "Cancel"],
        //                       cancelButtonIndex: options.length,
        //                       destructiveButtonIndex: 0,
        //                       userInterfaceStyle: theme.dark ? "dark" : "light",
        //                       textStyle: { color: theme.colors.text },
        //                       containerStyle: {
        //                         backgroundColor: theme.colors.card,
        //                       },
        //                     },
        //                     (index) => {
        //                       if (
        //                         index === undefined ||
        //                         index === options.length
        //                       )
        //                         return;
        //                       const selected = options[index];
        //                       if (!selected) return;
        //                     },
        //                   );
        //                 }}
        //               >
        //                 <Text
        //                   style={{
        //                     color: theme.colors.primary,
        //                   }}
        //                   className="text-base font-medium capitalize"
        //                 >
        //                   {appPrefs.defaultFeed}
        //                 </Text>
        //               </TouchableOpacity>
        //             ),
        //           },
        //         ]
        //       : [],
        // },
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
