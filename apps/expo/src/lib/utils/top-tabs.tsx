import { type MaterialTabBarProps } from "react-native-collapsible-tab-view";
import { type Theme } from "expo-router/react-navigation";

export function createTopTabsScreenOptions(theme: Theme) {
  return {
    style: {
      backgroundColor: theme.colors.card,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
    },
    contentContainerStyle: {
      paddingHorizontal: 16,
    },
    indicatorStyle: {
      backgroundColor: theme.colors.primary,
      bottom: -1,
      height: 3,
    },
    labelStyle: {
      textTransform: "none",
      color: theme.colors.text,
    },
    scrollEnabled: true,
    keepActiveTabCentered: true,
    // the theme type now allows any ColorValue, but our themes only use string colours
    activeColor: theme.colors.text as string,
    inactiveColor: theme.colors.text as string,
  } satisfies Partial<MaterialTabBarProps<string>>;
}
