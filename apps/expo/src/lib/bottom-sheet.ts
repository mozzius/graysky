import { useMemo } from "react";
import { StyleSheet } from "react-native";

import { useColorScheme } from "../lib/utils/color-scheme";

export const useBottomSheetStyles = () => {
  const { colorScheme } = useColorScheme();

  return useMemo(
    () =>
      StyleSheet.create({
        backgroundStyle: {
          backgroundColor: colorScheme === "light" ? "white" : "#121212",
        },
        contentContainerStyle: {
          backgroundColor: colorScheme === "light" ? "white" : "#121212",
        },
        textInputStyle: {
          padding: 0,
          fontSize: 20,
          lineHeight: 28,
          height: 150,
          color: colorScheme === "light" ? undefined : "white",
        },
        handleStyle: {
          backgroundColor: colorScheme === "light" ? "white" : "#121212",
          borderTopStartRadius: 15,
          borderTopEndRadius: 15,
        },
        handleIndicatorStyle: {
          backgroundColor: colorScheme === "light" ? "black" : "white",
        },
      }),
    [colorScheme],
  );
};
