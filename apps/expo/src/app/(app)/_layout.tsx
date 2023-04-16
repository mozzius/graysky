import { Stack, Tabs } from "expo-router";

import { useAgent } from "../../lib/agent";

export default function AppLayout() {
  const agent = useAgent();
  return (
    <>
      <Stack.Screen
        options={{ headerTitle: agent.session?.handle, animation: "none" }}
      />
      <Tabs screenOptions={{ headerShown: false }} />
    </>
  );
}
