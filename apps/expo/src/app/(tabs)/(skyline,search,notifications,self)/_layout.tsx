import { ComposerProvider } from "../../../components/composer";
import { Stack } from "expo-router";

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
