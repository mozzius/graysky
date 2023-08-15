import { Text as RNText, type TextProps } from "react-native";
import { useTheme } from "@react-navigation/native";

export const Text = ({ style, ...props }: TextProps) => {
  const theme = useTheme();

  return <RNText {...props} style={[{ color: theme.colors.text }, style]} />;
};
