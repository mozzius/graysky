import { useColorScheme as useRNColorScheme } from "react-native";
import { useColorScheme as useNWColorScheme } from "nativewind";

export const useColorScheme = () => {
  // fix for nativewind bug
  // trigger rerender when system dark mode changes

  // consider using this patch instead:
  // https://github.com/mmazzarolo/breathly-app/blob/master/patches/nativewind%2B2.0.11.patch

  // Basically nativewind's colorScheme value is wrong, so use the RN one instead

  return { ...useNWColorScheme(), colorScheme: useRNColorScheme() };
};
