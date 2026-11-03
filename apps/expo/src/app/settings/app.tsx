import { Alert } from "react-native";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Form } from "~/components/form";
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
  const { _ } = useLingui();

  const setAppPreferences = useSetAppPreferences();

  return (
    <TransparentHeaderUntilScrolled>
      <Form
        sections={[
          {
            title: _(msg`General`),
            rows: [
              {
                title: _(msg`Manually sort non-favourite feeds`),
                type: "toggle",
                value: sortableFeeds,
                onValueChange: (sortableFeeds) =>
                  setAppPreferences({ sortableFeeds }),
                accessibilityHint: _(
                  msg`Allows you to manually sort non-favourite feeds in the feeds tab`,
                ),
              },
              {
                title: _(msg`Show "My Lists" above "All Feeds"`),
                type: "toggle",
                value: listsAboveFeeds,
                onValueChange: (listsAboveFeeds) =>
                  setAppPreferences({ listsAboveFeeds }),
                accessibilityHint: _(
                  msg`Show lists above feeds in the feeds tab`,
                ),
              },
              {
                title: _(msg`Show each notification individually`),
                type: "toggle",
                value: !groupNotifications,
                onValueChange: (value) =>
                  setAppPreferences({ groupNotifications: !value }),
                accessibilityHint: _(
                  msg`Show each notification individually in the notification tab`,
                ),
              },
              {
                title: _(msg`Use in-app browser`),
                type: "toggle",
                value: !!inAppBrowser,
                onValueChange: (value) =>
                  setAppPreferences({ inAppBrowser: value }),
                accessibilityHint: _(
                  msg`Links will open in the app instead of your device's default browser`,
                ),
              },
            ],
          },
          {
            title: _(msg`Accessibility`),
            rows: [
              {
                title: _(msg`Disable haptics`),
                type: "toggle",
                value: !haptics,
                onValueChange: (disableHaptics) => {
                  const haptics = !disableHaptics;
                  setAppPreferences({ haptics });
                  if (!haptics) {
                    Alert.alert(
                      _(msg`Haptics disabled`),
                      _(
                        msg`The app won't trigger haptic feedback manually anymore, however some UI elements may still have haptics. If you are sensitive to this, please disable haptics in your device's system accessibility settings.`,
                      ),
                    );
                  }
                },
                accessibilityHint: _(msg`Disable haptics (vibrations)`),
              },
              {
                title: _(msg`Disable GIF autoplay`),
                type: "toggle",
                value: !gifAutoplay,
                onValueChange: (disableGifAutoplay) => {
                  const gifAutoplay = !disableGifAutoplay;
                  setAppPreferences({ gifAutoplay });
                },
                accessibilityHint: _(msg`Disable GIF autoplay`),
              },
              {
                title: _(msg`Mandatory ALT text`),
                type: "toggle",
                value: altText === "force",
                onValueChange: (force) => {
                  const altText = force ? "force" : "warn";
                  setAppPreferences({ altText });
                },
                accessibilityHint: _(
                  msg`Makes adding ALT text to your images mandatory`,
                ),
              },
            ],
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
