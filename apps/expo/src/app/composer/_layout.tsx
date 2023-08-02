import { Stack } from "expo-router";

export default function ComposerLayout() {
  return (
    <Stack screenOptions={{ customAnimationOnGesture: true }}>
      <Stack.Screen name="index" options={{ title: "New Post" }} />
      <Stack.Screen name="drafts" options={{ title: "Drafts" }} />
    </Stack>
  );
}
