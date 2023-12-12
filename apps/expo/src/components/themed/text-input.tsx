import { forwardRef } from "react";
import {
  TextInput as RNTextInput,
  StyleSheet,
  type TextInputProps,
} from "react-native";
import PasteInput, {
  type PasteInputProps,
  type PasteInputRef,
} from "@mattermost/react-native-paste-input";
import { useTheme } from "@react-navigation/native";
import colors from "tailwindcss/colors";

export type TextInput = RNTextInput;

export const TextInput = forwardRef<RNTextInput, TextInputProps>(
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

export const PasteableTextInput = forwardRef<PasteInputRef, PasteInputProps>(
  ({ style, ...props }, ref) => {
    const theme = useTheme();

    return (
      <PasteInput
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
