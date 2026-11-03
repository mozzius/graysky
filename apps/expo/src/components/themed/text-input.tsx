import { forwardRef } from "react";
import {
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputInstance,
  type TextInputProps,
} from "react-native";
import { useTheme } from "expo-router/react-navigation";
import colors from "tailwindcss/colors";

export type TextInput = TextInputInstance;

export const TextInput = forwardRef<TextInputInstance, TextInputProps>(
  ({ style, ...props }, ref) => {
    const theme = useTheme();

    return (
      <RNTextInput
        ref={ref}
        keyboardAppearance={theme.dark ? "dark" : "light"}
        placeholderTextColor={
          theme.dark ? colors.neutral[600] : colors.neutral[300]
        }
        {...props}
        style={StyleSheet.compose({ color: theme.colors.text }, style)}
      />
    );
  },
);

TextInput.displayName = "TextInput";

// temporarily not pasteable
export const PasteableTextInput = forwardRef<TextInput, TextInputProps>(
  ({ style, ...props }, ref) => {
    const theme = useTheme();

    return (
      <RNTextInput
        ref={ref}
        keyboardAppearance={theme.dark ? "dark" : "light"}
        placeholderTextColor={
          theme.dark ? colors.neutral[600] : colors.neutral[300]
        }
        {...props}
        style={StyleSheet.compose({ color: theme.colors.text }, style)}
      />
    );
  },
);

PasteableTextInput.displayName = "PasteableTextInput";
