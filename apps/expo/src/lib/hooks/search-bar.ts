import { Platform } from "react-native";
import { SearchBarProps } from "react-native-screens";
import { useTheme } from "@react-navigation/native";

export const useSearchBarOptions = (overrides: SearchBarProps) => {
  const theme = useTheme();

  return {
    textColor: theme.colors.text,
    hintTextColor: theme.dark ? theme.colors.text : "#BDBDBD",
    headerIconColor: theme.dark ? theme.colors.text : "#BDBDBD",
    ...overrides,
  } satisfies SearchBarProps;
};
