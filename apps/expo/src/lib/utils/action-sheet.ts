import { type ActionSheetOptions } from "@expo/react-native-action-sheet";
import { type Theme } from "@react-navigation/native";

export const actionSheetStyles = (theme: Theme) =>
  ({
    userInterfaceStyle: theme.dark ? "dark" : "light",
    textStyle: { color: theme.colors.text },
    messageTextStyle: { color: theme.colors.text },
    titleTextStyle: { color: theme.colors.text },
    containerStyle: { backgroundColor: theme.colors.card },
  }) as const satisfies Partial<ActionSheetOptions>;
