import { Alert, Switch } from "react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAppPreferences } from "~/lib/hooks/preferences";

export default function AppSettings() {
  const [appPrefs, setAppPrefs] = useAppPreferences();

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
                    value={appPrefs.sortableFeeds}
                    onValueChange={(sortableFeeds) =>
                      setAppPrefs({ sortableFeeds })
                    }
                    accessibilityHint="Allows you to manually sort non-favourite feeds in the feeds tab"
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
                    accessibilityHint="Show each notification individually in the notification tab"
                  />
                ),
              },
              {
                title: "Use in-app browser",
                action: (
                  <Switch
                    value={appPrefs.inAppBrowser}
                    onValueChange={(value) =>
                      setAppPrefs({ inAppBrowser: value })
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
                    value={!appPrefs.haptics}
                    onValueChange={(disableHaptics) => {
                      const haptics = !disableHaptics;
                      setAppPrefs({ haptics });
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
                    value={!appPrefs.gifAutoplay}
                    onValueChange={(disableGifAutoplay) => {
                      const gifAutoplay = !disableGifAutoplay;
                      setAppPrefs({ gifAutoplay });
                    }}
                    accessibilityHint="Disable GIF autoplay"
                  />
                ),
              },
              {
                title: "Mandatory ALT text",
                action: (
                  <Switch
                    value={appPrefs.altText === "force"}
                    onValueChange={(force) => {
                      const altText = force ? "force" : "warn";
                      setAppPrefs({ altText });
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
