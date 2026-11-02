import { useTheme } from "expo-router/react-navigation";

export function usePlainBackgroundColor() {
  const theme = useTheme();

  return theme.dark ? theme.colors.background : "#fff";
}
