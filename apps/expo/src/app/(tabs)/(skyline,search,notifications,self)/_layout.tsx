import { Stack } from "expo-router";

import { ComposerProvider } from "../../../components/composer";

export default function SubStack() {
  return (
    <ComposerProvider>
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
        }}
      />
    </ComposerProvider>
  );
}
