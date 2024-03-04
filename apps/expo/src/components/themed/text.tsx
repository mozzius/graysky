import { Text as RNText, StyleSheet, type TextProps } from "react-native";
import { UITextView } from "react-native-uitextview";
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
export const SelectableText = ({
  style,
  primary,
  selectable = true,
  uiTextView = true,
  ...props
}: TextProps & { primary?: boolean; uiTextView?: boolean }) => {
  const theme = useTheme();

  return (
    <UITextView
      selectable={selectable}
      uiTextView={uiTextView}
      {...props}
      style={StyleSheet.compose(
        { color: primary ? theme.colors.primary : theme.colors.text },
        style,
      )}
    />
  );
};
