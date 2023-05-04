import { useCallback, useRef, useState } from "react";
import { Alert, Dimensions, Text, View, type ColorValue } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { TouchableOpacity } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Stack, Tabs } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Cloudy,
  LogOut,
  Palette,
  Search,
  Settings2,
  Ticket,
  User,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { ActorDetails } from "../../components/actor-details";
import { Avatar } from "../../components/avatar";
import {
  InviteCodes,
  type InviteCodesRef,
} from "../../components/invite-codes";
import { useAuthedAgent } from "../../lib/agent";
import { useLogOut } from "../../lib/log-out-context";

export default function AppLayout() {
  const agent = useAuthedAgent();
  const [open, setOpen] = useState(false);
  const logOut = useLogOut();
  const inviteRef = useRef<InviteCodesRef>(null);

  const { colorScheme, toggleColorScheme } = useColorScheme();
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
      <SafeAreaView className="h-full p-8">
        <ActorDetails />
        <View className="mt-8 border-t border-neutral-300 pt-4">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Invite codes"
            className="mt-2 w-full flex-row items-center py-2"
            onPress={() => inviteRef.current?.open()}
          >
            <Ticket color={textColor} />
            <Text className="ml-6 text-base font-medium dark:text-white">
              Invite codes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Settings"
            className="mt-2 w-full flex-row items-center py-2"
            onPress={() => toggleColorScheme()}
          >
            <Palette color={textColor} />
            <Text className="ml-6 text-base font-medium dark:text-white">
              Toggle theme
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Settings"
            className="mt-2 w-full flex-row items-center py-2"
            onPress={() => Alert.alert("Not yet implemented")}
          >
            <Settings2 color={textColor} />
            <Text className="ml-6 text-base font-medium dark:text-white">
              Settings
            </Text>
          </TouchableOpacity>
        </View>
        <View className="grow" />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          className="w-full flex-row items-center py-2"
          onPress={() => void logOut()}
        >
          <LogOut color={textColor} />
          <Text className="ml-6 text-base font-medium dark:text-white">
            Sign out
          </Text>
        </TouchableOpacity>
        <Text className="mt-4 text-neutral-400">
          Version {Constants.expoConfig?.version ?? "unknown"}
        </Text>
      </SafeAreaView>
    ),
    [logOut, toggleColorScheme, textColor],
  );

  return (
    <>
      <Drawer
        open={open}
        onOpen={() => setOpen(true)}
        onClose={() => setOpen(false)}
        renderDrawerContent={renderDrawerContent}
        drawerType="slide"
        statusBarAnimation="slide"
        drawerStyle={{
          width: Dimensions.get("window").width * 0.8,
          backgroundColor: colorScheme === "light" ? "#FFF" : "#1C1C1C",
        }}
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
              headerLeft: () => (
                <TouchableOpacity
                  className="ml-6"
                  onPress={() => setOpen(true)}
                >
                  <Avatar size="small" />
                </TouchableOpacity>
              ),
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
      </Drawer>
      <InviteCodes ref={inviteRef} />
    </>
  );
}
