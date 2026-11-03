import { useCallback } from "react";
import { Platform, StatusBar as RNStatusBar } from "react-native";
import * as NavigationBar from "expo-navigation-bar";
import { useFocusEffect, useTheme } from "expo-router/react-navigation";

import { isIOS26 } from "~/lib/utils/version";

type Style = "light" | "dark" | "auto";

interface Props {
  style?: Style;
  modal?: boolean;
  applyToNavigationBar?: boolean;
}

export const StatusBar = ({ style, modal, applyToNavigationBar }: Props) => {
  const theme = useTheme();

  useFocusEffect(
    useCallback(() => {
      let statusBarStyle: Style = style ?? "auto";
      if (modal) {
        if (Platform.OS === "ios" ? Platform.isPad || isIOS26 : true) {
          // use whatever the underlying screen is using
          return;
        } else {
          statusBarStyle = style ?? "light";
        }
      }
      // "auto" follows the app theme rather than the system
      const resolved =
        statusBarStyle === "auto"
          ? theme.dark
            ? "light"
            : "dark"
          : statusBarStyle;
      const entry = RNStatusBar.pushStackEntry({
        barStyle: resolved === "light" ? "light-content" : "dark-content",
      });
      // the navigation bar has no stack, so reset it to match the theme on blur.
      // note its styles describe the bar, not the content - light content
      // means a "dark" bar
      if (applyToNavigationBar && Platform.OS === "android") {
        NavigationBar.setStyle(resolved === "light" ? "dark" : "light");
      }
      return () => {
        RNStatusBar.popStackEntry(entry);
        if (applyToNavigationBar && Platform.OS === "android") {
          NavigationBar.setStyle(theme.dark ? "dark" : "light");
        }
      };
    }, [style, modal, applyToNavigationBar, theme.dark]),
  );

  return null;
};
