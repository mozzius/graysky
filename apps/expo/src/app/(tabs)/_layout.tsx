import { useCallback, useRef, useState } from "react";
import { Dimensions, type ColorValue } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { Stack, Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Cloudy, Search, User } from "lucide-react-native";

import { DrawerContent, DrawerProvider } from "../../components/drawer-content";
import {
  InviteCodes,
  type InviteCodesRef,
} from "../../components/invite-codes";
import { useAuthedAgent } from "../../lib/agent";
import { useColorScheme } from "../../lib/hooks";

export default function AppLayout() {
  const agent = useAuthedAgent();
  const [open, setOpen] = useState(false);
  const inviteRef = useRef<InviteCodesRef>(null);
  const { colorScheme } = useColorScheme();
  const textColor = colorScheme === "light" ? "#000" : "#FFF";

  const tabBarIconColors =
    colorScheme === "light"
      ? {
          color: {
            focused: "#1C1C1C",
            unfocused: "#9b9b9b",
          },
          fill: {
            focused: "#1C1C1C",
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

  const renderDrawerContent = useCallback(
    () => (
      <DrawerContent
        openInviteCodes={() => inviteRef.current?.open()}
        textColor={textColor}
      />
    ),
    [textColor],
  );

  const openDrawer = useCallback(() => setOpen(true), []);

  return (
    <DrawerProvider value={openDrawer}>
      <Drawer
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        renderDrawerContent={renderDrawerContent}
        drawerType="slide"
        statusBarAnimation="slide"
        drawerStyle={{
          width: Dimensions.get("window").width * 0.8,
          backgroundColor: colorScheme === "light" ? "#FFF" : "#121212",
        }}
        swipeEdgeWidth={Dimensions.get("window").width * 0.1}
      >
        <Stack.Screen
          options={{
            headerShown: false,
            animation: "none",
          }}
        />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            // Would be nice - need to fix composer
            // tabBarStyle: {
            //   position: "absolute",
            //   backgroundColor: "rgba(255, 255, 255, 0.95)",
            // },
            headerTitleStyle: {
              color: textColor,
            },
          }}
        >
          <Tabs.Screen
            name="(skyline)"
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
            name="(search)"
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
            name="(notifications)"
            options={{
              title: `Notifications${
                notifications.data?.data?.count || undefined
                  ? ", new items"
                  : ""
              }`,
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
            name="(self)"
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
      </Drawer>
      <InviteCodes ref={inviteRef} />
    </DrawerProvider>
  );
}
