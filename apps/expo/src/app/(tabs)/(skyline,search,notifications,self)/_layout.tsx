import { Stack } from "expo-router";
import { useColorScheme } from "nativewind";

import { ComposerProvider } from "../../../components/composer";

export default function SubStack() {
  const { colorScheme } = useColorScheme();
  return (
    <ComposerProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          fullScreenGestureEnabled: true,
          headerStyle: {
            backgroundColor: colorScheme === "light" ? "#fff" : "#000",
          },
        }}
      />
    </ComposerProvider>
  );
}
