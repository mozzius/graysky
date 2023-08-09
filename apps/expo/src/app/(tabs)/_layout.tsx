import { useCallback, useEffect, useState } from "react";
import { Dimensions, Platform } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { Stack, Tabs, useRouter, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import {
  BellIcon,
  CloudyIcon,
  PenBox,
  SearchIcon,
  UserIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { type ColorSchemeSystem } from "nativewind/dist/style-sheet/color-scheme";
import { z } from "zod";

import { DrawerContent, DrawerProvider } from "../../components/drawer-content";
import { useAgent } from "../../lib/agent";

export default function AppLayout() {
  const agent = useAgent();
  const [open, setOpen] = useState(false);
  const { setColorScheme } = useColorScheme();

  const notifications = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      if (!agent.hasSession) return null;
      return await agent.countUnreadNotifications();
    },
    // refetch every 15 seconds
    refetchInterval: 1000 * 15,
  });

  const renderDrawerContent = useCallback(() => <DrawerContent />, []);

  useEffect(() => {
    void AsyncStorage.getItem("color-scheme").then((value) => {
      const scheme = z.enum(["light", "dark", "system"]).safeParse(value);
      if (scheme.success) {
        setColorScheme(scheme.data);
      } else {
        void AsyncStorage.setItem(
          "color-scheme",
          "system" satisfies ColorSchemeSystem,
        );
      }
    });
  }, [setColorScheme]);

  const openDrawer = useCallback((open = true) => setOpen(open), []);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const theme = useTheme();
  const segments = useSegments();
  const router = useRouter();

  return (
    <DrawerProvider value={openDrawer}>
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
          width: Math.min(Dimensions.get("window").width * 0.8, 350),
          backgroundColor: theme.colors.card,
        }}
        swipeEdgeWidth={Dimensions.get("window").width}
        swipeEnabled={Platform.OS === "ios" ? segments.length === 3 : true}
      >
        <Tabs
          screenListeners={{
            tabPress: (evt) => {
              if (evt.target?.startsWith("null")) {
                evt.preventDefault();
                if (agent.hasSession) {
                  router.push("/composer");
                }
              }
            },
          }}
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
            name="(feeds)"
            options={{
              title: "Feeds",
              tabBarIcon({ color }) {
                return <CloudyIcon color={color} />;
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
                notifications.data?.data?.count || undefined
                  ? ", new items"
                  : ""
              }`,
              tabBarBadge: notifications.data?.data?.count || undefined,
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
