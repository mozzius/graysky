import { Fragment, useEffect, useState } from "react";
import {
  ScrollView,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Link,
  Stack,
  useNavigation,
  usePathname,
  useRouter,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@react-navigation/native";
import { type LucideIcon } from "lucide-react-native";

import { ItemSeparator } from "../../components/item-separator";
import { SettingsRow } from "../../components/settings-row";

export default function SettingsLayout() {
  const theme = useTheme();
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const navigation = useNavigation();
  const pathname = usePathname();

  useEffect(() => {
    // we want to do navigation.getState().routes.length > 1
    // however this is the layout so we need to go find the child route
    setCanGoBack(
      (navigation.getState().routes.find((x) => x.name === "settings")?.state
        ?.routes.length ?? 1) > 1,
    );
  }, [pathname, navigation]);

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
          headerRight: canGoBack
            ? undefined
            : () => (
                <TouchableOpacity onPress={() => router.push("../")}>
                  <Text
                    style={{ color: theme.colors.primary }}
                    className="text-lg font-medium"
                  >
                    Done
                  </Text>
                </TouchableOpacity>
              ),
        }}
      >
        <Stack.Screen
          name="index"
          options={{
            title: "Settings",
          }}
        />
        <Stack.Screen
          name="account/index"
          options={{
            title: "Account Settings",
          }}
        />
        <Stack.Screen
          name="account/edit-bio"
          options={{
            title: "Edit Profile",
          }}
        />
        <Stack.Screen
          name="account/change-handle"
          options={{
            title: "Change Handle",
          }}
        />
        <Stack.Screen
          name="moderation"
          options={{
            title: "Moderation",
          }}
        />
        <Stack.Screen
          name="app"
          options={{
            title: "App Settings",
          }}
        />
      </Stack>
    </>
  );
}

interface Props {
  options: {
    title: string;
    icon?: LucideIcon;
    href?: string;
    onPress?: () => void;
    action?: React.ReactNode;
  }[];
  children?: React.ReactNode;
}

export const SettingsList = ({ children, options }: Props) => {
  const theme = useTheme();
  return (
    <ScrollView className="flex-1 px-6">
      <View
        style={{ backgroundColor: theme.colors.card }}
        className="my-8 overflow-hidden rounded-lg"
      >
        {children}
        {options.map((option, i, arr) => {
          const row = (
            <SettingsRow
              icon={option.icon}
              chevron={!!option.href || !!option.onPress}
              action={option.action}
            >
              <Text className="text-base dark:text-white">{option.title}</Text>
            </SettingsRow>
          );
          return (
            <Fragment key={option.title}>
              {option.href ? (
                <Link asChild href={option.href}>
                  <TouchableHighlight>{row}</TouchableHighlight>
                </Link>
              ) : option.onPress ? (
                <TouchableHighlight onPress={option.onPress}>
                  {row}
                </TouchableHighlight>
              ) : (
                row
              )}
              {i !== arr.length - 1 && (
                <ItemSeparator iconWidth={option.icon ? "w-6" : undefined} />
              )}
            </Fragment>
          );
        })}
      </View>
    </ScrollView>
  );
};
