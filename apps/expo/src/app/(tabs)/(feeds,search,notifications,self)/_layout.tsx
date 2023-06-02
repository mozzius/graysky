import { Stack } from "expo-router";

import { ComposerProvider } from "../../../components/composer";

export default function SubStack() {
  return (
    <ComposerProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          fullScreenGestureEnabled: true,
          // headerStyle: {
          //   backgroundColor: colorScheme === "light" ? "#fff" : "#000",
          // },
        }}
      />
    </ComposerProvider>
  );
}
