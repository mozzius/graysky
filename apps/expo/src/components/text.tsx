import { Text as RNText, StyleSheet, type TextProps } from "react-native";
import { useTheme } from "@react-navigation/native";

export const Text = ({ style, ...props }: TextProps) => {
  const theme = useTheme();

  return (
    <RNText
      {...props}
      style={StyleSheet.compose({ color: theme.colors.text }, style)}
    />
  );
};
