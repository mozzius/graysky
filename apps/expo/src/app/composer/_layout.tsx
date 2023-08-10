import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function ComposerLayout() {
  return (
    <>
      {Platform.OS === "ios" && <StatusBar style="light" />}
      <Stack screenOptions={{ customAnimationOnGesture: true }}>
        <Stack.Screen name="index" options={{ title: "New Post" }} />
        <Stack.Screen name="drafts" options={{ title: "Drafts" }} />
      </Stack>
    </>
  );
}
