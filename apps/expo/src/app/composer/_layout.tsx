import { Stack } from "expo-router";

import { StatusBar } from "../../components/status-bar";

export default function ComposerLayout() {
  return (
    <>
      <StatusBar modal />
      <Stack screenOptions={{ customAnimationOnGesture: true }}>
        <Stack.Screen name="index" options={{ title: "New Post" }} />
        <Stack.Screen name="drafts" options={{ title: "Drafts" }} />
      </Stack>
    </>
  );
}
