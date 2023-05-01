import { useCallback, useRef } from "react";
import { Alert, Dimensions, Text, View, type ColorValue } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import DrawerLayout from "react-native-gesture-handler/DrawerLayout";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Stack, Tabs } from "expo-router";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Brush,
  Cloudy,
  LogOut,
  Search,
  Settings2,
  Ticket,
  User,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { ErrorBoundary } from "react-error-boundary";

import { ActorDetails } from "../../components/actor-details";
import { Avatar } from "../../components/avatar";
import { useAuthedAgent } from "../../lib/agent";
import { useLogOut } from "../../lib/log-out-context";

export default function AppLayout() {
  const agent = useAuthedAgent();
  const { showActionSheetWithOptions } = useActionSheet();
  const drawerRef = useRef<DrawerLayout>(null!);
  const logOut = useLogOut();
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

  const renderDrawerContent = useCallback(
    () => (
      <SafeAreaView className="h-full p-8">
        <ErrorBoundary fallback={<></>}>
          <ActorDetails />
        </ErrorBoundary>
        <View className="mt-8 border-t border-neutral-300 pt-4">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Invite codes"
            className="mt-2 w-full flex-row items-center py-2"
            onPress={() => Alert.alert("Not yet implemented")}
          >
            <Ticket color="black" />
            <Text className="ml-6 text-base font-medium">Invite codes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Settings"
            className="mt-2 w-full flex-row items-center py-2"
            onPress={() => {
              const options = ["System", "Light", "Dark", "Cancel"];
              showActionSheetWithOptions(
                {
                  title: `Set app theme`,
                  options,
                  cancelButtonIndex: options.length - 1,
                },
                (index) => {
                  const option = options[index!];
                  if (!option) return;
                  switch (option) {
                    case "System":
                    case "Light":
                    case "Dark":
                      Alert.alert("Not yet implemented");
                  }
                },
              );
            }}
          >
            <Brush color="black" />
            <Text className="ml-6 text-base font-medium">Theme</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Settings"
            className="mt-2 w-full flex-row items-center py-2"
            onPress={() => Alert.alert("Not yet implemented")}
          >
            <Settings2 color="black" />
            <Text className="ml-6 text-base font-medium">Settings</Text>
          </TouchableOpacity>
        </View>
        <View className="grow" />
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          className="w-full flex-row items-center py-2"
          onPress={() => void logOut()}
        >
          <LogOut color="black" />
          <Text className="ml-6 text-base font-medium">Sign out</Text>
        </TouchableOpacity>
        <Text className="mt-4 text-neutral-400">
          Version {Constants.expoConfig?.version ?? "unknown"}
        </Text>
      </SafeAreaView>
    ),
    [showActionSheetWithOptions, logOut],
  );

  return (
    <DrawerLayout
      ref={drawerRef}
      renderNavigationView={renderDrawerContent}
      drawerType="slide"
      drawerWidth={Dimensions.get("window").width * 0.8}
      drawerBackgroundColor="white"
      hideStatusBar
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
                onPress={() => drawerRef.current.openDrawer()}
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
    </DrawerLayout>
  );
}
