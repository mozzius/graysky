import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@react-navigation/native";

import { useColorScheme } from "../lib/utils/color-scheme";

export const useBottomSheetStyles = () => {
  const { colorScheme } = useColorScheme();
  const theme = useTheme();

  return useMemo(
    () =>
      StyleSheet.create({
        backgroundStyle: {
          backgroundColor: theme.colors.card,
        },
        contentContainerStyle: {
          backgroundColor: theme.colors.card,
        },
        textInputStyle: {
          padding: 0,
          fontSize: 20,
          lineHeight: 28,
          height: 150,
          color: theme.colors.text,
        },
        handleStyle: {
          backgroundColor: theme.colors.card,
          borderTopStartRadius: 15,
          borderTopEndRadius: 15,
        },
        handleIndicatorStyle: {
          backgroundColor: theme.colors.text,
        },
      }),
    [colorScheme, theme],
  );
};
