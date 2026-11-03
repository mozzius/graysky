import { type SearchBarProps } from "react-native-screens";
import { useTheme } from "expo-router/react-navigation";

export const useSearchBarOptions = (overrides: SearchBarProps) => {
  const theme = useTheme();

  return {
    textColor: theme.colors.text,
    hintTextColor: theme.dark ? theme.colors.text : "#BDBDBD",
    headerIconColor: theme.dark ? theme.colors.text : "#BDBDBD",
    ...overrides,
  } satisfies SearchBarProps;
};
