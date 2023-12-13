import { type MaterialTabBarProps } from "react-native-collapsible-tab-view";
import { type Theme } from "@react-navigation/native";

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
    activeColor: theme.colors.text,
    inactiveColor: theme.colors.text,
  } satisfies Partial<MaterialTabBarProps<string>>;
}
