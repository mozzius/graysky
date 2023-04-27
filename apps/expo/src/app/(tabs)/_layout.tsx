import { Stack, Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Cloudy, Search, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useAuthedAgent } from "../../lib/agent";

export default function AppLayout() {
  const agent = useAuthedAgent();
  const { colorScheme } = useColorScheme();
  const backgroundColor = colorScheme === "light" ? "#FFF" : "#000";
  const textColor = colorScheme === "light" ? "#000" : "#FFF";

  const notifications = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      return await agent.countUnreadNotifications();
    },
    // refetch every 30 seconds
    refetchInterval: 1000 * 30,
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="skyline"
          options={{
            title: "Skyline",
            tabBarShowLabel: false,
            headerTitleStyle: {
              color: textColor,
            },
            tabBarStyle: {
              backgroundColor: backgroundColor,
            },
            headerStyle: {
              backgroundColor: backgroundColor,
            },
            tabBarIcon({ focused }) {
              return <Cloudy color={focused ? "#505050" : "#9b9b9b"} />;
            },
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarShowLabel: false,
            headerTitleStyle: {
              color: textColor,
            },
            tabBarStyle: {
              backgroundColor: backgroundColor,
            },
            headerStyle: {
              backgroundColor: backgroundColor,
            },
            tabBarIcon({ focused }) {
              return <Search color={focused ? "#505050" : "#9b9b9b"} />;
            },
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            tabBarShowLabel: false,
            tabBarBadge: notifications.data?.data?.count || undefined,
            tabBarBadgeStyle: {
              backgroundColor: "#505050",
              fontSize: 12,
            },
            headerTitleStyle: {
              color: textColor,
            },
            tabBarStyle: {
              backgroundColor: backgroundColor,
            },
            headerStyle: {
              backgroundColor: backgroundColor,
            },
            tabBarIcon({ focused }) {
              return <Bell color={focused ? "#505050" : "#9b9b9b"} />;
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarShowLabel: false,
            headerTitleStyle: {
              color: textColor,
            },
            tabBarStyle: {
              backgroundColor: backgroundColor,
            },
            headerStyle: {
              backgroundColor: backgroundColor,
            },
            tabBarIcon({ focused }) {
              return <User color={focused ? "#505050" : "#9b9b9b"} />;
            },
          }}
        />
      </Tabs>
    </>
  );
}
