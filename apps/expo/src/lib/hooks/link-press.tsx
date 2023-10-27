import { useCallback } from "react";
import { Platform, Share } from "react-native";
import { showToastable } from "react-native-toastable";
import * as Clipboard from "expo-clipboard";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { CopyIcon, ExternalLinkIcon, Share2Icon } from "lucide-react-native";
import * as Sentry from "sentry-expo";

import { actionSheetStyles } from "../utils/action-sheet";
import { useAppPreferences } from "./preferences";

export const useLinkPress = () => {
  const { showActionSheetWithOptions } = useActionSheet();
  const [{ inAppBrowser }] = useAppPreferences();
  const theme = useTheme();

  const openLink = useCallback(
    async (url: string) => {
      try {
        if (inAppBrowser) {
          await WebBrowser.openBrowserAsync(url, {
            presentationStyle:
              WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          });
        } else {
          await Linking.openURL(url);
        }
      } catch (err) {
        showToastable({
          title: "Failed to open link",
          message:
            err instanceof Error ? err.message : "Not sure why, sorry :(",
          status: "danger",
        });
        Sentry.Native.captureException(err);
      }
    },
    [inAppBrowser],
  );

  const showLinkOptions = useCallback(
    (url: string) => {
      const options = ["Open link", "Copy link", "Share link"] as const;
      const icons = [
        <ExternalLinkIcon size={24} color={theme.colors.text} key={0} />,
        <CopyIcon size={24} color={theme.colors.text} key={1} />,
        <Share2Icon size={24} color={theme.colors.text} key={2} />,
        <></>,
      ];
      showActionSheetWithOptions(
        {
          title: url,
          options: [...options, "Cancel"],
          cancelButtonIndex: options.length,
          icons,
          ...actionSheetStyles(theme),
        },
        (index) => {
          if (index === undefined) return;
          switch (options[index]) {
            case "Open link":
              void openLink(url);
              break;
            case "Copy link":
              void Clipboard.setUrlAsync(url);
              showToastable({
                title: "Copied link",
                message: "Link copied to clipboard",
              });
              break;
            case "Share link":
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
    [showActionSheetWithOptions, theme, openLink],
  );

  return { openLink, showLinkOptions };
};
