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
            headerLargeTitle: true,
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
          name="blocks"
          options={{
            title: "Blocked Users",
          }}
        />
        <Stack.Screen
          name="mutes"
          options={{
            title: "Muted Users",
          }}
        />
        <Stack.Screen
          name="app"
          options={{
            title: "App Settings",
          }}
        />
        <Stack.Screen
          name="about"
          options={{
            title: "About",
          }}
        />
      </Stack>
    </>
  );
}

interface ListProps {
  options: {
    title: string;
    icon?: LucideIcon;
    href?: string;
    onPress?: () => void;
    action?: React.ReactNode;
  }[];
  children?: React.ReactNode;
}

const SettingsListInner = ({ children, options }: ListProps) => {
  const theme = useTheme();
  return (
    <View
      style={{ backgroundColor: theme.colors.card }}
      className="overflow-hidden rounded-lg"
    >
      {children}
      {options.map((option, i, arr) => {
        const row = (
          <SettingsRow
            icon={option.icon}
            chevron={!!option.href || !!option.onPress}
            action={option.action}
          >
            <Text style={{ color: theme.colors.text }} className="text-base">
              {option.title}
            </Text>
          </SettingsRow>
        );
        return (
          <Fragment key={option.title}>
            {option.href ? (
              <Link asChild href={option.href}>
                <TouchableHighlight>
                  <View>{row}</View>
                </TouchableHighlight>
              </Link>
            ) : option.onPress ? (
              <TouchableHighlight onPress={option.onPress}>
                <View>{row}</View>
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
  );
};

export const SettingsList = (props: ListProps) => {
  return (
    <ScrollView className="flex-1 px-6">
      <View className="my-8">
        <SettingsListInner {...props} />
      </View>
    </ScrollView>
  );
};

interface GroupProps {
  groups: (ListProps & {
    title?: string;
  })[];
  children?: React.ReactNode;
}

export const SettingsListGroups = ({ groups, children }: GroupProps) => {
  return (
    <ScrollView className="flex-1 px-4">
      <View className="mt-4">{children}</View>
      {groups.map(({ title, ...list }, i, arr) => (
        <View key={i} className={i === arr.length - 1 ? "mb-16" : "mb-4"}>
          {title && (
            <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
              {title}
            </Text>
          )}
          <SettingsListInner {...list} />
        </View>
      ))}
    </ScrollView>
  );
};
