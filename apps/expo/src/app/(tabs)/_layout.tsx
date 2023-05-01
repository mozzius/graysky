import { type ColorValue } from "react-native";
import { Stack, Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Cloudy, Search, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useAuthedAgent } from "../../lib/agent";

export default function AppLayout() {
  const agent = useAuthedAgent();
  const { colorScheme } = useColorScheme();
  const textColor = colorScheme === "light" ? "#000" : "#FFF";
  const tabBarIconColors =
    colorScheme === "light"
      ? {
          color: {
            focused: "#505050",
            unfocused: "#9b9b9b",
          },
          fill: {
            focused: "#505050",
            unfocused: undefined,
          },
        }
      : {
          color: {
            focused: "#fff",
            unfocused: "#fff",
          },
          fill: {
            focused: "#fff",
            unfocused: undefined,
          },
        };
  const tabBarBadgeColor: ColorValue =
    colorScheme === "light" ? "#262626" : "#FFF";
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
          // TODO: do we still need this?
          headerTitleStyle: {
            color: textColor,
          },
        }}
      >
        <Tabs.Screen
          name="skyline"
          options={{
            title: "Skyline",
            tabBarIcon({ focused }) {
              return (
                <Cloudy
                  color={
                    focused
                      ? tabBarIconColors.color.focused
                      : tabBarIconColors.color.unfocused
                  }
                  fill={
                    focused
                      ? tabBarIconColors.fill.focused
                      : tabBarIconColors.fill.unfocused
                  }
                />
              );
            },
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon({ focused }) {
              return (
                <Search
                  color={
                    focused
                      ? tabBarIconColors.color.focused
                      : tabBarIconColors.color.unfocused
                  }
                  fill={
                    focused
                      ? tabBarIconColors.fill.focused
                      : tabBarIconColors.fill.unfocused
                  }
                />
              );
            },
          }}
        />
        <Tabs.Screen
          name="notifications"
          options={{
            title: "Notifications",
            tabBarBadge: notifications.data?.data?.count || undefined,
            tabBarBadgeStyle: {
              backgroundColor: tabBarBadgeColor,
              fontSize: 12,
            },
            tabBarIcon({ focused }) {
              return (
                <Bell
                  color={
                    focused
                      ? tabBarIconColors.color.focused
                      : tabBarIconColors.color.unfocused
                  }
                  fill={
                    focused
                      ? tabBarIconColors.fill.focused
                      : tabBarIconColors.fill.unfocused
                  }
                />
              );
            },
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon({ focused }) {
              return (
                <User
                  color={
                    focused
                      ? tabBarIconColors.color.focused
                      : tabBarIconColors.color.unfocused
                  }
                  fill={
                    focused
                      ? tabBarIconColors.fill.focused
                      : tabBarIconColors.fill.unfocused
                  }
                />
              );
            },
          }}
        />
      </Tabs>
    </>
  );
}
