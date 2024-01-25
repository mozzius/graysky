import { Text as RNText, StyleSheet, type TextProps } from "react-native";
import { useTheme } from "@react-navigation/native";

export const Text = ({
  style,
  primary,
  ...props
}: TextProps & { primary?: boolean }) => {
  const theme = useTheme();

  return (
    <RNText
      {...props}
      style={StyleSheet.compose(
        { color: primary ? theme.colors.primary : theme.colors.text },
        style,
      )}
    />
  );
};
