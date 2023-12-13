import { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Link } from "expo-router";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import {
  CloudyIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SmartphoneIcon,
  StarIcon,
  SunIcon,
  TicketIcon,
} from "lucide-react-native";
import { type ColorSchemeSystem } from "nativewind/dist/style-sheet/color-scheme";

import { useInviteCodes } from "~/app/codes/_layout";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { useLogOut } from "~/lib/log-out-context";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { BackButtonOverride } from "../back-button-override";
import { Text } from "../themed/text";
import { ActorDetails } from "./actor-details";
import { useDrawer } from "./context";

interface Props {
  open: boolean;
}

export const DrawerContent = ({ open }: Props) => {
  const logOut = useLogOut();
  const { showActionSheetWithOptions } = useActionSheet();
  const codes = useInviteCodes();
  const setOpenDrawer = useDrawer();
  const theme = useTheme();
  const [{ homepage, colorScheme }, setAppPrefs] = useAppPreferences();

  const closeDrawer = useCallback(() => setOpenDrawer(false), [setOpenDrawer]);

  const changeTheme = () => {
    const options = ["Light", "Dark", "System", "Cancel"];
    const icons = [
      <SunIcon key={0} size={24} color={theme.colors.text} />,
      <MoonIcon key={1} size={24} color={theme.colors.text} />,
      <SmartphoneIcon key={2} size={24} color={theme.colors.text} />,
      <></>,
    ];
    showActionSheetWithOptions(
      {
        title: "Change theme",
        message: `It's currently set to the ${colorScheme} theme`,
        options,
        icons,
        cancelButtonIndex: options.length - 1,
        ...actionSheetStyles(theme),
      },
      (index) => {
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
        setAppPrefs({ colorScheme });
      },
    );
  };

  const numCodes = (codes.data?.unused ?? []).reduce(
    (acc, code) => (acc += code.available),
    0,
  );

  const ChangeThemeIcon = theme.dark ? MoonIcon : SunIcon;

  return (
    <SafeAreaView className="h-full p-8">
      {open && <BackButtonOverride dismiss={closeDrawer} />}
      <ActorDetails />
      <View className="mt-8 border-t border-neutral-300 pt-4">
        {homepage === "skyline" && (
          <Link href="/feeds/manage" asChild onPress={closeDrawer}>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Feeds screen"
              className="mt-2 w-full flex-row items-center py-2"
            >
              <CloudyIcon color={theme.colors.text} />
              <Text className="ml-6 text-base font-medium">My feeds</Text>
            </TouchableOpacity>
          </Link>
        )}
        {codes.isSuccess && (
          <Link href="/codes" asChild onPress={closeDrawer}>
            <TouchableOpacity
              accessibilityRole="link"
              accessibilityLabel="Invite codes"
              className="mt-2 w-full flex-row items-center py-2"
            >
              <TicketIcon color={theme.colors.text} />
              <Text className="ml-6 text-base font-medium">
                Invite codes
                {numCodes > 0 && (
                  <>
                    {" "}
                    <Text style={{ color: theme.colors.primary }}>
                      ({numCodes})
                    </Text>
                  </>
                )}
              </Text>
            </TouchableOpacity>
          </Link>
        )}
        <Link href="/pro" asChild onPress={closeDrawer}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Pro version"
            className="mt-2 w-full flex-row items-center py-2"
          >
            <StarIcon color={theme.colors.text} />
            <Text className="ml-6 text-base font-medium">Graysky Pro</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Change theme"
          className="mt-2 w-full flex-row items-center py-2"
          onPress={() => changeTheme()}
        >
          <ChangeThemeIcon color={theme.colors.text} />
          <Text className="ml-6 text-base font-medium">Change theme</Text>
        </TouchableOpacity>
        <Link href="/settings" asChild onPress={closeDrawer}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Settings"
            className="mt-2 w-full flex-row items-center py-2"
          >
            <SettingsIcon color={theme.colors.text} />
            <Text className="ml-6 text-base font-medium">Settings</Text>
          </TouchableOpacity>
        </Link>
      </View>
      <View className="grow" />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        className="w-full flex-row items-center py-2"
        onPress={() => logOut()}
      >
        <LogOutIcon color={theme.colors.text} />
        <Text className="ml-6 text-base font-medium">Sign out</Text>
      </TouchableOpacity>
      <Text className="mt-4 text-neutral-500 dark:text-neutral-400">
        Version {Constants.expoConfig?.version ?? "unknown"}
      </Text>
    </SafeAreaView>
  );
};
