import { useColorScheme as useRNColorScheme } from "react-native";
import { useColorScheme as useNWColorScheme } from "nativewind";

export const useColorScheme = () => {
  // fix for nativewind bug
  // trigger rerender when system dark mode changes
  useRNColorScheme();
  // consider using this patch instead:
  // https://github.com/mmazzarolo/breathly-app/blob/master/patches/nativewind%2B2.0.11.patch

  return useNWColorScheme();
};
