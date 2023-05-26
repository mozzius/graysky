import { createContext, useContext } from "react";
import { Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Link } from "expo-router";
import { LogOut, Palette, Settings2, Ticket } from "lucide-react-native";

import { useColorScheme } from "../lib/hooks";
import { useLogOut } from "../lib/log-out-context";
import { ActorDetails } from "./actor-details";
import { useInviteCodes } from "./invite-codes";

interface Props {
  openInviteCodes: () => void;
  textColor: string;
}

const DrawerContext = createContext<(() => void) | null>(null);

export const DrawerProvider = DrawerContext.Provider;

export const useDrawer = () => {
  const openDrawer = useContext(DrawerContext);
  if (!openDrawer)
    throw new Error("useDrawer must be used within a DrawerProvider");
  return openDrawer;
};

export const DrawerContent = ({ openInviteCodes, textColor }: Props) => {
  const logOut = useLogOut();
  const { toggleColorScheme } = useColorScheme();
  const codes = useInviteCodes();

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
          <Ticket color={textColor} />
          <Text className="ml-6 text-base font-medium dark:text-white">
            Invite codes{numCodes > 0 && ` (${numCodes})`}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Toggle theme"
          className="mt-2 w-full flex-row items-center py-2"
          onPress={() => toggleColorScheme()}
        >
          <Palette color={textColor} />
          <Text className="ml-6 text-base font-medium dark:text-white">
            Toggle theme
          </Text>
        </TouchableOpacity>
        <Link href="/settings" asChild>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Settings"
            className="mt-2 w-full flex-row items-center py-2"
          >
            <Settings2 color={textColor} />
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
        <LogOut color={textColor} />
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
