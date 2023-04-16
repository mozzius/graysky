import { Stack, Tabs } from "expo-router";
import { Cloudy, User } from "lucide-react-native";

import { useAgent } from "../../../lib/agent";

export default function AppLayout() {
  const agent = useAgent();
  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: agent.session?.handle,
          animation: "none",
          headerBackTitleVisible: false,
        }}
      />
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="timeline"
          options={{
            title: "Timeline",
            tabBarShowLabel: false,
            tabBarIcon({ focused }) {
              return <Cloudy color={focused ? "#505050" : "#9b9b9b"} />;
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarShowLabel: false,
            tabBarIcon({ focused }) {
              return <User color={focused ? "#505050" : "#9b9b9b"} />;
            },
          }}
        />
      </Tabs>
    </>
  );
}
