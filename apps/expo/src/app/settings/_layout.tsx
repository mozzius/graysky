import { useEffect, useState } from "react";
import { Text, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useNavigation, usePathname, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@react-navigation/native";

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
                <Animated.View entering={FadeIn}>
                  <TouchableOpacity onPress={() => router.push("../")}>
                    <Text
                      style={{ color: theme.colors.primary }}
                      className="text-lg font-medium"
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
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
