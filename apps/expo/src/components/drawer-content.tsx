import { createContext, useContext } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Link } from "expo-router";
import { useActionSheet } from "@expo/react-native-action-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "@react-navigation/native";
import { LogOut, Palette, Settings2, Star, Ticket } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import { type ColorSchemeSystem } from "nativewind/dist/style-sheet/color-scheme";

import { useInviteCodes } from "../app/codes/_layout";
import { useAgent } from "../lib/agent";
import { useLogOut } from "../lib/log-out-context";
import { ActorDetails } from "./actor-details";

const DrawerContext = createContext<((open?: boolean) => void) | null>(null);

export const DrawerProvider = DrawerContext.Provider;

export const useDrawer = () => {
  const openDrawer = useContext(DrawerContext);
  if (!openDrawer)
    throw new Error("useDrawer must be used within a DrawerProvider");
  return openDrawer;
};

export const DrawerContent = () => {
  const logOut = useLogOut();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const agent = useAgent();
  const codes = useInviteCodes();
  const setOpenDrawer = useDrawer();
  const theme = useTheme();

  const changeTheme = () => {
    const options = ["Light", "Dark", "System", "Cancel"];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        userInterfaceStyle: colorScheme,
      },
      async (index) => {
        if (index === undefined) return;
        const selected = options[index];
        let colorScheme: ColorSchemeSystem | null = null;
        switch (selected) {
          case "Light":
            colorScheme = "light";
            break;
          case "Dark":
            colorScheme = "dark";
            break;
          case "System":
            colorScheme = "system";
            break;
        }
        if (!colorScheme) return;
        await AsyncStorage.setItem("color-scheme", colorScheme);
        setColorScheme(colorScheme);
      },
    );
  };

  const numCodes = (codes.data?.unused ?? []).reduce(
    (acc, code) => (acc += code.available),
    0,
  );

  return (
    <SafeAreaView className="h-full p-8">
      <ActorDetails />
      <View className="mt-8 border-t border-neutral-300 pt-4">
        <Link href="/codes" asChild onPress={() => setOpenDrawer(false)}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Invite codes"
            className="mt-2 w-full flex-row items-center py-2"
          >
            <Ticket style={{ color: theme.colors.text }} />
            <Text
              style={{ color: theme.colors.text }}
              className="ml-6 text-base font-medium"
            >
              Invite codes{numCodes > 0 && ` (${numCodes})`}
            </Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change theme"
          className="mt-2 w-full flex-row items-center py-2"
          onPress={() => changeTheme()}
        >
          <Palette style={{ color: theme.colors.text }} />
          <Text
            style={{ color: theme.colors.text }}
            className="ml-6 text-base font-medium"
          >
            Change theme
          </Text>
        </TouchableOpacity>
        {agent?.session?.handle === "mozzius.dev" && (
          <Link href="/pro" asChild onPress={() => setOpenDrawer(false)}>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Pro version"
              className="mt-2 w-full flex-row items-center py-2"
            >
              <Star style={{ color: theme.colors.text }} />
              <Text
                style={{ color: theme.colors.text }}
                className="ml-6 text-base font-medium"
              >
                Graysky Pro
              </Text>
            </TouchableOpacity>
          </Link>
        )}
        <Link href="/settings" asChild onPress={() => setOpenDrawer(false)}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Settings"
            className="mt-2 w-full flex-row items-center py-2"
          >
            <Settings2 style={{ color: theme.colors.text }} />
            <Text
              style={{ color: theme.colors.text }}
              className="ml-6 text-base font-medium"
            >
              Settings
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
      <View className="grow" />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        className="w-full flex-row items-center py-2"
        onPress={() => void logOut()}
      >
        <LogOut style={{ color: theme.colors.text }} />
        <Text
          style={{ color: theme.colors.text }}
          className="ml-6 text-base font-medium"
        >
          Sign out
        </Text>
      </TouchableOpacity>
      <Text className="mt-4 text-neutral-500 dark:text-neutral-400">
        Version {Constants.expoConfig?.version ?? "unknown"}
      </Text>
    </SafeAreaView>
  );
};
