import { createContext, useContext } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Link } from "expo-router";
import { useActionSheet } from "@expo/react-native-action-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LogOut, Palette, Settings2, Ticket } from "lucide-react-native";
import { type ColorSchemeSystem } from "nativewind/dist/style-sheet/color-scheme";

import { useLogOut } from "../lib/log-out-context";
import { useColorScheme } from "../lib/utils/color-scheme";
import { ActorDetails } from "./actor-details";
import { useInviteCodes } from "./invite-codes";

interface Props {
  openInviteCodes: () => void;
}

const DrawerContext = createContext<((open?: boolean) => void) | null>(null);

export const DrawerProvider = DrawerContext.Provider;

export const useDrawer = () => {
  const openDrawer = useContext(DrawerContext);
  if (!openDrawer)
    throw new Error("useDrawer must be used within a DrawerProvider");
  return openDrawer;
};

export const DrawerContent = ({ openInviteCodes }: Props) => {
  const logOut = useLogOut();
  const { colorScheme, setColorScheme } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const codes = useInviteCodes();
  const setOpenDrawer = useDrawer();

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
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Invite codes"
          className="mt-2 w-full flex-row items-center py-2"
          onPress={openInviteCodes}
        >
          <Ticket className="text-black dark:text-white" />
          <Text className="ml-6 text-base font-medium dark:text-white">
            Invite codes{numCodes > 0 && ` (${numCodes})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change theme"
          className="mt-2 w-full flex-row items-center py-2"
          onPress={() => changeTheme()}
        >
          <Palette className="text-black dark:text-white" />
          <Text className="ml-6 text-base font-medium dark:text-white">
            Change theme
          </Text>
        </TouchableOpacity>
        <Link href="/settings" asChild onPress={() => setOpenDrawer(false)}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Settings"
            className="mt-2 w-full flex-row items-center py-2"
          >
            <Settings2 className="text-black dark:text-white" />
            <Text className="ml-6 text-base font-medium dark:text-white">
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
        <LogOut className="text-black dark:text-white" />
        <Text className="ml-6 text-base font-medium dark:text-white">
          Sign out
        </Text>
      </TouchableOpacity>
      <Text className="mt-4 text-neutral-400">
        Version {Constants.expoConfig?.version ?? "unknown"}
      </Text>
    </SafeAreaView>
  );
};
