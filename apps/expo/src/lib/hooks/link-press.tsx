import { useCallback } from "react";
import { Platform, Share } from "react-native";
import { toast } from "sonner-native";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import { useTheme } from "expo-router/react-navigation";
import * as WebBrowser from "expo-web-browser";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import * as Sentry from "@sentry/react-native";
import { CopyIcon, ExternalLinkIcon, Share2Icon } from "lucide-react-native";

import {
  useInAppBrowser,
  useSetAppPreferences,
} from "../storage/app-preferences";
import { actionSheetStyles } from "../utils/action-sheet";

export const useLinkPress = () => {
  const { showActionSheetWithOptions } = useActionSheet();
  const inAppBrowser = useInAppBrowser();
  const setAppPreferences = useSetAppPreferences();
  const theme = useTheme();
  const { _ } = useLingui();

  const openLink = useCallback(
    async (url: string) => {
      try {
        if (inAppBrowser === undefined) {
          showActionSheetWithOptions(
            {
              title: _(msg`How should we open this link?`),
              message: _(
                msg`Your choice will be saved, but can be changed in settings`,
              ),
              options: [
                _(msg`Use in-app browser`),
                _(msg`Use my default browser`),
                _(msg`Cancel`),
              ],
              cancelButtonIndex: 2,
              ...actionSheetStyles(theme),
            },
            (index) => {
              if (index === undefined) return;
              switch (index) {
                case 0:
                  setAppPreferences({ inAppBrowser: true });
                  void WebBrowser.openBrowserAsync(url, {
                    presentationStyle:
                      WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                    // theme colours are typed as ColorValue, but ours are always strings
                    toolbarColor: theme.colors.card as string,
                  });
                  break;
                case 1:
                  setAppPreferences({ inAppBrowser: false });
                  void Linking.openURL(url);
                  break;
              }
            },
          );
        } else if (inAppBrowser) {
          await WebBrowser.openBrowserAsync(url, {
            presentationStyle:
              WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
            toolbarColor: theme.colors.card as string,
          });
        } else {
          await Linking.openURL(url);
        }
      } catch (err) {
        toast.error(_(msg`Failed to open link`), {
          description:
            err instanceof Error ? err.message : _(msg`Not sure why, sorry :(`),
        });
        Sentry.captureException(err);
      }
    },
    [inAppBrowser, setAppPreferences, showActionSheetWithOptions, theme, _],
  );

  const showLinkOptions = useCallback(
    (url: string) => {
      const options = [
        _(msg`Open link`),
        _(msg`Copy link`),
        _(msg`Share link`),
      ] as const;
      const icons = [
        <ExternalLinkIcon size={24} color={theme.colors.text} key={0} />,
        <CopyIcon size={24} color={theme.colors.text} key={1} />,
        <Share2Icon size={24} color={theme.colors.text} key={2} />,
        <></>,
      ];
      showActionSheetWithOptions(
        {
          title: url,
          options: [...options, _(msg`Cancel`)],
          cancelButtonIndex: options.length,
          icons,
          ...actionSheetStyles(theme),
        },
        async (index) => {
          switch (index) {
            case 0:
              void openLink(url);
              break;
            case 1:
              if (Platform.OS === "ios") {
                await Clipboard.setUrlAsync(url);
              } else {
                await Clipboard.setStringAsync(url);
              }
              toast.success(_(msg`Copied link`), {
                description: _(msg`Link copied to clipboard`),
              });
              break;
            case 2:
              void Share.share(
                Platform.select({
                  ios: { url },
                  default: { message: url },
                }),
              );
              break;
          }
        },
      );
    },
    [showActionSheetWithOptions, theme, openLink, _],
  );

  return { openLink, showLinkOptions };
};
