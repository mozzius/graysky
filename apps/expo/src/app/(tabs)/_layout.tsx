import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { Stack, Tabs, useSegments } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Bell, Cloudy, Search, User } from "lucide-react-native";
import { type ColorSchemeSystem } from "nativewind/dist/style-sheet/color-scheme";
import { z } from "zod";

import { DrawerContent, DrawerProvider } from "../../components/drawer-content";
import {
  InviteCodes,
  type InviteCodesRef,
} from "../../components/invite-codes";
import { useAuthedAgent } from "../../lib/agent";
import { useColorScheme } from "../../lib/utils/color-scheme";

export default function AppLayout() {
  const agent = useAuthedAgent();
  const [open, setOpen] = useState(false);
  const inviteRef = useRef<InviteCodesRef>(null);
  const { setColorScheme } = useColorScheme();

  const notifications = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      return await agent.countUnreadNotifications();
    },
    // refetch every 15 seconds
    refetchInterval: 1000 * 15,
  });

  const renderDrawerContent = useCallback(
    () => <DrawerContent openInviteCodes={() => inviteRef.current?.open()} />,
    [],
  );

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

  const openDrawer = useCallback(() => setOpen(true), []);
  const theme = useTheme();
  const segments = useSegments();

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
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        renderDrawerContent={renderDrawerContent}
        drawerType="slide"
        statusBarAnimation="slide"
        drawerStyle={{
          width: Dimensions.get("window").width * 0.8,
          backgroundColor: theme.colors.card,
        }}
        swipeEdgeWidth={Dimensions.get("window").width}
        swipeEnabled={segments.length === 3}
      >
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
            name="(feeds)"
            options={{
              title: "Feeds",
              tabBarIcon({ color }) {
                return <Cloudy color={color} />;
              },
            }}
          />
          <Tabs.Screen
            name="(search)"
            options={{
              title: "Search",
              tabBarIcon({ color }) {
                return <Search color={color} />;
              },
            }}
          />
          <Tabs.Screen
            name="(notifications)"
            options={{
              title: `Notifications${
                notifications.data?.data?.count || undefined
                  ? ", new items"
                  : ""
              }`,
              tabBarBadge: notifications.data?.data?.count || undefined,
              tabBarBadgeStyle: {
                backgroundColor: theme.colors.primary,
              },
              tabBarIcon({ color }) {
                return <Bell color={color} />;
              },
            }}
          />
          <Tabs.Screen
            name="(self)"
            options={{
              title: "Profile",
              tabBarIcon({ color }) {
                return <User color={color} />;
              },
            }}
          />
        </Tabs>
      </Drawer>
      <InviteCodes ref={inviteRef} />
    </DrawerProvider>
  );
}
