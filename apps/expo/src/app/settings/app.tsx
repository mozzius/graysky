import { Alert, Switch } from "react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import {
  useAltText,
  useGifAutoplay,
  useGroupNotifications,
  useHaptics,
  useInAppBrowser,
  useListsAboveFeeds,
  useSetAppPreferences,
  useSortableFeeds,
} from "~/lib/storage/app-preferences";

export default function AppSettings() {
  const sortableFeeds = useSortableFeeds();
  const listsAboveFeeds = useListsAboveFeeds();
  const groupNotifications = useGroupNotifications();
  const inAppBrowser = useInAppBrowser();
  const haptics = useHaptics();
  const gifAutoplay = useGifAutoplay();
  const altText = useAltText();

  const setAppPreferences = useSetAppPreferences();

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: "General",
            options: [
              {
                title: "Manually sort non-favourite feeds",
                action: (
                  <Switch
                    value={sortableFeeds}
                    onValueChange={(sortableFeeds) =>
                      setAppPreferences({ sortableFeeds })
                    }
                    accessibilityHint="Allows you to manually sort non-favourite feeds in the feeds tab"
                  />
                ),
              },
              {
                title: 'Show "My Lists" above "All Feeds"',
                action: (
                  <Switch
                    value={listsAboveFeeds}
                    onValueChange={(listsAboveFeeds) =>
                      setAppPreferences({ listsAboveFeeds })
                    }
                    accessibilityHint="Show lists above feeds in the feeds tab"
                  />
                ),
              },
              {
                title: "Show each notification individually",
                action: (
                  <Switch
                    value={!groupNotifications}
                    onValueChange={(value) =>
                      setAppPreferences({ groupNotifications: !value })
                    }
                    accessibilityHint="Show each notification individually in the notification tab"
                  />
                ),
              },
              {
                title: "Use in-app browser",
                action: (
                  <Switch
                    value={inAppBrowser}
                    onValueChange={(value) =>
                      setAppPreferences({ inAppBrowser: value })
                    }
                    accessibilityHint="Links will open in the app instead of your device's default browser"
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
                    value={!haptics}
                    onValueChange={(disableHaptics) => {
                      const haptics = !disableHaptics;
                      setAppPreferences({ haptics });
                      if (!haptics) {
                        Alert.alert(
                          "Haptics disabled",
                          "The app won't trigger haptic feedback manually anymore, however some UI elements may still have haptics. If you are sensitive to this, please disable haptics in your device's system accessibility settings.",
                        );
                      }
                    }}
                    accessibilityHint="Disable haptics (vibrations)"
                  />
                ),
              },
              {
                title: "Disable GIF autoplay",
                action: (
                  <Switch
                    value={!gifAutoplay}
                    onValueChange={(disableGifAutoplay) => {
                      const gifAutoplay = !disableGifAutoplay;
                      setAppPreferences({ gifAutoplay });
                    }}
                    accessibilityHint="Disable GIF autoplay"
                  />
                ),
              },
              {
                title: "Mandatory ALT text",
                action: (
                  <Switch
                    value={altText === "force"}
                    onValueChange={(force) => {
                      const altText = force ? "force" : "warn";
                      setAppPreferences({ altText });
                    }}
                    accessibilityHint="Makes adding ALT text to your images mandatory"
                  />
                ),
              },
            ],
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
