import { type Theme } from "@react-navigation/native";

export function createTopTabsScreenOptions(theme: Theme) {
  return {
    tabBarScrollEnabled: true,
    tabBarIndicatorContainerStyle: {
      marginHorizontal: 16,
    },
    tabBarStyle: {
      backgroundColor: theme.colors.card,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      paddingHorizontal: 16,
    },
    tabBarItemStyle: {
      width: "auto",
    },
    tabBarIndicatorStyle: {
      backgroundColor: theme.colors.primary,
      bottom: -1,
      height: 2.5,
    },
    tabBarLabelStyle: {
      textTransform: "none",
    },
  } as const;
}
