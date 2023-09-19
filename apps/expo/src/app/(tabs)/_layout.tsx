import { useCallback, useState } from "react";
import { Dimensions, Platform } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { Stack, Tabs, useRouter, useSegments } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import {
  BellIcon,
  CloudIcon,
  CloudyIcon,
  PenBox,
  SearchIcon,
  UserIcon,
} from "lucide-react-native";

import { DrawerContent, DrawerProvider } from "~/components/drawer-content";
import { StatusBar } from "~/components/status-bar";
import { useOptionalAgent } from "~/lib/agent";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { useRefreshOnFocus } from "~/lib/utils/query";

export default function AppLayout() {
  // agent might not be available yet
  const agent = useOptionalAgent();
  const [open, setOpen] = useState(false);

  const notifications = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      if (!agent?.hasSession) return null;
      const unreadCount = await agent.countUnreadNotifications();
      if (!unreadCount.success)
        throw new Error("Failed to fetch notifications");
      return unreadCount.data;
    },
    // refetch every 15 seconds
    refetchInterval: 1000 * 15,
  });

  useRefreshOnFocus(notifications.refetch);

  const renderDrawerContent = useCallback(() => <DrawerContent />, []);

  const openDrawer = useCallback((open = true) => setOpen(open), []);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const theme = useTheme();
  const segments = useSegments();
  const router = useRouter();

  const [{ homepage }] = useAppPreferences();

  return (
    <DrawerProvider value={openDrawer}>
      <StatusBar />
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "none",
          gestureEnabled: false,
        }}
      />
      <Drawer
        open={open}
        onOpen={onOpen}
        onClose={onClose}
        renderDrawerContent={renderDrawerContent}
        drawerType="slide"
        statusBarAnimation="slide"
        drawerStyle={{
          width: Math.min(Dimensions.get("window").width * 0.8, 400),
          backgroundColor: theme.colors.card,
        }}
        swipeEdgeWidth={Dimensions.get("window").width}
        swipeEnabled={Platform.OS === "ios" ? segments.length === 3 : true}
      >
        <Tabs
          screenOptions={{ headerShown: false }}
          screenListeners={{
            tabPress: (evt) => {
              if (evt.target?.startsWith("null")) {
                evt.preventDefault();
                if (agent?.hasSession) {
                  router.push("/composer");
                }
              }
            },
          }}
        >
          <Tabs.Screen
            name="(feeds)"
            options={{
              title: homepage === "feeds" ? "Feeds" : "Skyline",
              tabBarIcon({ color }) {
                return homepage === "feeds" ? (
                  <CloudyIcon color={color} />
                ) : (
                  <CloudIcon color={color} />
                );
              },
            }}
          />
          <Tabs.Screen
            name="(search)"
            options={{
              title: "Search",
              tabBarIcon({ color }) {
                return <SearchIcon color={color} />;
              },
            }}
          />
          <Tabs.Screen
            name="null"
            options={{
              title: "Post",
              tabBarIcon({ color }) {
                return <PenBox color={color} />;
              },
            }}
          />
          <Tabs.Screen
            name="(notifications)"
            options={{
              title: "Notifications",
              tabBarAccessibilityLabel: `Notifications${
                notifications.data?.count || undefined ? ", new items" : ""
              }`,
              tabBarBadge: notifications.data?.count || undefined,
              tabBarBadgeStyle: {
                fontSize: 12,
                backgroundColor: theme.colors.primary,
              },
              tabBarIcon({ color }) {
                return <BellIcon color={color} />;
              },
            }}
          />
          <Tabs.Screen
            name="(self)"
            options={{
              title: "Profile",
              headerShown: false,
              tabBarIcon({ color }) {
                return <UserIcon color={color} />;
              },
            }}
          />
        </Tabs>
      </Drawer>
    </DrawerProvider>
  );
}
