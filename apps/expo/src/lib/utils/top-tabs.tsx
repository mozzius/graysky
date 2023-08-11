import { type Theme } from "@react-navigation/native";

export function createTopTabsScreenOptions(theme: Theme) {
  return {
    indicatorContainerStyle: {
      marginHorizontal: 16,
    },
    style: {
      backgroundColor: theme.colors.card,
      borderBottomColor: theme.colors.border,
      borderBottomWidth: 1,
      paddingHorizontal: 16,
    },
    itemStyle: {
      width: "auto",
    },
    indicatorStyle: {
      backgroundColor: theme.colors.primary,
      bottom: -1,
      height: 2.5,
    },
    labelStyle: {
      textTransform: "none",
      color: theme.colors.text,
    },
    scrollEnabled: true,
    keepActiveTabCentered: true,
  } as const;
}
