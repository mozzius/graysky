import { useCallback } from "react";
import { TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Link } from "expo-router";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import {
  CloudyIcon,
  LogOutIcon,
  MoonIcon,
  SettingsIcon,
  SmartphoneIcon,
  StarIcon,
  SunIcon,
} from "lucide-react-native";
import { type ColorSchemeSystem } from "nativewind/dist/style-sheet/color-scheme";

import { useLogOut } from "~/lib/log-out-context";
import {
  useColorScheme,
  useHomepage,
  useSetAppPreferences,
} from "~/lib/storage/app-preferences";
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
  // const codes = useInviteCodes();
  const setOpenDrawer = useDrawer();
  const theme = useTheme();
  const homepage = useHomepage();
  const colorScheme = useColorScheme();
  const setAppPreferences = useSetAppPreferences();
  const { _ } = useLingui();

  const closeDrawer = useCallback(() => setOpenDrawer(false), [setOpenDrawer]);

  const changeTheme = () => {
    const options = [
      _(msg`Light`),
      _(msg`Dark`),
      _(msg`System`),
      _(msg`Cancel`),
    ];
    const icons = [
      <SunIcon key={0} size={24} color={theme.colors.text} />,
      <MoonIcon key={1} size={24} color={theme.colors.text} />,
      <SmartphoneIcon key={2} size={24} color={theme.colors.text} />,
      <></>,
    ];
    const current = {
      light: _(msg`light`),
      dark: _(msg`dark`),
      system: _(msg`system`),
    }[colorScheme];
    showActionSheetWithOptions(
      {
        title: _(msg`Change theme`),
        message: _(msg`It's currently set to the ${current} theme`),
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
          case _(msg`Light`):
            colorScheme = "light";
            break;
          case _(msg`Dark`):
            colorScheme = "dark";
            break;
          case _(msg`System`):
            colorScheme = "system";
            break;
        }
        if (!colorScheme) return;
        setAppPreferences({ colorScheme });
      },
    );
  };

  // const numCodes = (codes.data?.unused ?? []).reduce(
  //   (acc, code) => (acc += code.available),
  //   0,
  // );

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
              <Text className="ml-6 text-base font-medium">
                <Trans>My feeds</Trans>
              </Text>
            </TouchableOpacity>
          </Link>
        )}
        {/* <Link
          href="/codes"
          asChild
          onPress={(evt) => {
            switch (codes.status) {
              case "pending":
                evt.preventDefault();
                Alert.alert("Loading codes...");
                break;
              case "error":
                evt.preventDefault();
                Alert.alert(
                  "Viewing invite codes is not available",
                  "To protect your codes, you must be logged in with your main password to use this feature.",
                );
                break;
              default:
                closeDrawer();
                break;
            }
          }}
        >
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Invite codes"
            className={cx(
              "mt-2 w-full flex-row items-center py-2",
              !codes.isSuccess && "opacity-30",
            )}
          >
            <TicketIcon color={theme.colors.text} />
            <Text className="ml-6 text-base font-medium">
              Invite codes
              {numCodes > 0 && (
                <>
                  {" "}
                  <Text primary>({numCodes})</Text>
                </>
              )}
            </Text>
          </TouchableOpacity>
        </Link> */}
        <Link href="/pro" asChild onPress={closeDrawer}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Pro version"
            className="mt-2 w-full flex-row items-center py-2"
          >
            <StarIcon color={theme.colors.text} />
            <Text className="ml-6 text-base font-medium">
              <Trans>Graysky Pro</Trans>
            </Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={_(msg`Change theme`)}
          className="mt-2 w-full flex-row items-center py-2"
          onPress={() => changeTheme()}
        >
          <ChangeThemeIcon color={theme.colors.text} />
          <Text className="ml-6 text-base font-medium">
            <Trans>Change theme</Trans>
          </Text>
        </TouchableOpacity>
        <Link href="/settings" asChild onPress={closeDrawer}>
          <TouchableOpacity
            accessibilityRole="link"
            accessibilityLabel="Settings"
            className="mt-2 w-full flex-row items-center py-2"
          >
            <SettingsIcon color={theme.colors.text} />
            <Text className="ml-6 text-base font-medium">
              <Trans>Settings</Trans>
            </Text>
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
        <Text className="ml-6 text-base font-medium">
          <Trans>Sign out</Trans>
        </Text>
      </TouchableOpacity>
      <Text className="mt-4 text-neutral-500 dark:text-neutral-400">
        {Constants.expoConfig?.version ? (
          <Trans>Version {Constants.expoConfig.version}</Trans>
        ) : (
          <Trans>Version unknown</Trans>
        )}
      </Text>
    </SafeAreaView>
  );
};
