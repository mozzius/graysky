import { useEffect, useState } from "react";
import { Platform, Text, TouchableOpacity } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Stack, useNavigation, usePathname, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { StatusBar } from "../../components/status-bar";

export default function AuthLayout() {
  const theme = useTheme();
  const router = useRouter();
  const [canGoBack, setCanGoBack] = useState(false);
  const navigation = useNavigation();
  const pathname = usePathname();

  useEffect(() => {
    // we want to do navigation.getState().routes.length > 1
    // however this is the layout so we need to go find the child route
    setCanGoBack(
      (navigation.getState().routes.find((x) => x.name === "(auth)")?.state
        ?.routes.length ?? 1) > 1,
    );
  }, [pathname, navigation]);

  return (
    <>
      <StatusBar modal />
      <Stack
        screenOptions={{
          fullScreenGestureEnabled: true,
          headerLeft:
            canGoBack || Platform.OS === "android"
              ? undefined
              : () => (
                  <Animated.View entering={FadeIn}>
                    <TouchableOpacity onPress={() => router.push("../")}>
                      <Text
                        style={{ color: theme.colors.primary }}
                        className="text-lg"
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                ),
        }}
      >
        <Stack.Screen name="null" />
        <Stack.Screen
          name="login"
          options={{
            title: "Login",
          }}
        />
        <Stack.Screen
          name="sign-up"
          options={{
            title: "Sign up",
          }}
        />
        <Stack.Screen
          name="reset-password"
          options={{
            title: "Reset Password",
          }}
        />
        <Stack.Screen
          name="waitlist"
          options={{
            title: "Join the Waitlist",
          }}
        />
      </Stack>
    </>
  );
}
