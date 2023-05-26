import { Stack } from "expo-router";

import { ComposerProvider } from "../../../components/composer";
import { useColorScheme } from "../../../lib/utils/color-scheme";

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
