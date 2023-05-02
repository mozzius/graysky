import { Stack, Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Cloudy, Search, User } from "lucide-react-native";

import { useAuthedAgent } from "../../lib/agent";

export default function AppLayout() {
  const agent = useAuthedAgent();

  const notifications = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      return await agent.countUnreadNotifications();
    },
    // refetch every 15 seconds
    refetchInterval: 1000 * 15,
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "none",
        }}
      />
      <Tabs
        screenOptions={{
          headerShown: false,
          // Would be nice - need to fix composer
          // tabBarStyle: {
          //   position: "absolute",
          //   backgroundColor: "rgba(255, 255, 255, 0.95)",
          // },
        }}
      >
        <Tabs.Screen
          name="skyline"
          options={{
            title: "Skyline",
            tabBarShowLabel: false,
            tabBarIcon({ focused }) {
              return (
                <Cloudy
                  color={focused ? "#505050" : "#9b9b9b"}
                  fill={focused ? "#505050" : undefined}
                />
              );
            },
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarShowLabel: false,
            tabBarIcon({ focused }) {
              return (
                <Search
                  color={focused ? "#505050" : "#9b9b9b"}
                  fill={focused ? "#505050" : undefined}
                />
              );
            },
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: `Notifications${
              notifications.data?.data?.count || undefined ? ", new items" : ""
            }`,
            tabBarShowLabel: false,
            tabBarBadge: notifications.data?.data?.count || undefined,
            tabBarBadgeStyle: {
              backgroundColor: "#262626",
              fontSize: 12,
            },
            tabBarIcon({ focused }) {
              return (
                <Bell
                  color={focused ? "#505050" : "#9b9b9b"}
                  fill={focused ? "#505050" : undefined}
                />
              );
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarShowLabel: false,
            tabBarIcon({ focused }) {
              return (
                <User
                  color={focused ? "#505050" : "#9b9b9b"}
                  fill={focused ? "#505050" : undefined}
                />
              );
            },
          }}
        />
      </Tabs>
    </>
  );
}
