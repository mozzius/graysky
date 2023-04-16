import { Stack, Tabs } from "expo-router";

import { useAuthedAgent } from "../../lib/agent";

export default function AppLayout() {
  const agent = useAuthedAgent();
  return (
    <>
      <Stack.Screen
        options={{ headerTitle: agent.session.handle, animation: "none" }}
      />
      <Tabs screenOptions={{ headerShown: false }} />
    </>
  );
}
