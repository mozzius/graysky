import { useCallback, useEffect, useMemo, useState } from "react";
import { Linking, Platform, Text, TouchableOpacity } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import {
  SplashScreen,
  Stack,
  useNavigation,
  useRouter,
  useSegments,
} from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BskyAgent,
  type AtpSessionData,
  type AtpSessionEvent,
} from "@atproto/api";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLinkIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import * as Sentry from "sentry-expo";

import { ListProvider } from "../components/lists/context";
import { AgentProvider } from "../lib/agent";
// import {
//   configureRevenueCat,
//   CustomerInfoProvider,
//   useCustomerInfoQuery,
// } from "../lib/hooks/purchases";
import { LogOutProvider } from "../lib/log-out-context";
import { TRPCProvider } from "../lib/utils/api";
import { fetchHandler } from "../lib/utils/polyfills/fetch-polyfill";

Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentry as string,
  enableInExpoDevelopment: false,
});

// configureRevenueCat();

SplashScreen.preventAutoHideAsync();

const App = () => {
  const segments = useSegments();
  const router = useRouter();

  const [invalidator, setInvalidator] = useState(0);
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();

  // const info = useCustomerInfoQuery();

  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const sess = await AsyncStorage.getItem("session");
      if (!sess) return null;
      return JSON.parse(sess) as AtpSessionData;
    },
  });

  const saveSession = useMutation({
    mutationFn: async (sess: AtpSessionData | null) => {
      if (sess) {
        await AsyncStorage.setItem("session", JSON.stringify(sess));
      } else {
        await AsyncStorage.removeItem("session");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries(["session"]);
    },
  });

  const resumeSession = useMutation({
    mutationFn: async (sess: AtpSessionData) => {
      await agent.resumeSession(sess);
    },
    retry: true,
  });

  const agent = useMemo(() => {
    BskyAgent.configure({ fetch: fetchHandler });
    return new BskyAgent({
      service: "https://bsky.social",
      persistSession(evt: AtpSessionEvent, sess?: AtpSessionData) {
        switch (evt) {
          case "create":
            if (!sess) throw new Error("should be unreachable");
            saveSession.mutate(sess);
            break;
          case "create-failed":
            break;
          case "update":
            if (!sess) throw new Error("should be unreachable");
            saveSession.mutate(sess);
            break;
          case "expired":
            saveSession.mutate(null);
            break;
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidator]);

  useEffect(() => {
    if (session.data && !agent.hasSession) {
      resumeSession.mutate(session.data);
    }
  }, [session.data, agent]);

  // redirect depending on login state
  useEffect(() => {
    if (typeof session.data === "undefined") return;
    const atRoot = segments.length === 0;
    const inAuthGroup = segments[0] === "(auth)";

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !agent.hasSession &&
      !inAuthGroup &&
      !atRoot
    ) {
      // Redirect to the sign-in page.
      if (segments.join("/") === "(auth)/login") return;
      router.replace("/");
    } else if (agent.hasSession && (inAuthGroup || atRoot)) {
      if (segments.join("/") === "(tabs)/(feeds)/feeds") return;
      router.replace("/feeds");
    }
  }, [segments, router, session.data, agent.hasSession]);

  const logOut = useCallback(async () => {
    await AsyncStorage.removeItem("session");
    queryClient.clear();
    setInvalidator((i) => i + 1);
  }, []);

  const theme = colorScheme === "light" ? DefaultTheme : DarkTheme;

  const navigation = useNavigation();
  useEffect(() => {
    if (session.isFetched) {
      SplashScreen.hideAsync();
    }
  }, [session.isFetched]);

  function handleModalBack() {
    if (navigation.canGoBack()) {
      router.push("../");
    } else {
      router.push("/feeds");
    }
  }

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <SafeAreaProvider>
        {/* <CustomerInfoProvider info={info.data}> */}
        <AgentProvider value={agent}>
          <LogOutProvider value={logOut}>
            <ActionSheetProvider>
              <ListProvider>
                <Stack
                  screenOptions={{
                    headerShown: true,
                    fullScreenGestureEnabled: true,
                  }}
                >
                  <Stack.Screen
                    name="index"
                    options={{
                      headerShown: false,
                    }}
                  />
                  <Stack.Screen
                    name="(auth)/login"
                    options={{
                      title: "Log in",
                      presentation: "formSheet",
                      headerLeft: Platform.select({
                        ios: () => (
                          <TouchableOpacity onPress={() => router.push("/")}>
                            <Text
                              style={{ color: theme.colors.primary }}
                              className="text-lg"
                            >
                              Cancel
                            </Text>
                          </TouchableOpacity>
                        ),
                      }),
                      headerRight: () => (
                        <TouchableOpacity
                          className="flex-row items-center gap-1"
                          onPress={() => Linking.openURL("https://bsky.app")}
                        >
                          <Text
                            style={{ color: theme.colors.primary }}
                            className="text-lg"
                          >
                            Register
                          </Text>
                          <ExternalLinkIcon
                            size={16}
                            color={theme.colors.primary}
                          />
                        </TouchableOpacity>
                      ),
                    }}
                  />
                  <Stack.Screen
                    name="settings"
                    options={{
                      headerShown: false,
                      presentation: "modal",
                    }}
                  />
                  <Stack.Screen
                    name="codes"
                    options={{
                      headerShown: false,
                      presentation: "modal",
                    }}
                  />
                  <Stack.Screen
                    name="translate"
                    options={{
                      title: "Translate",
                      presentation: "modal",
                      headerRight: () => (
                        <TouchableOpacity onPress={handleModalBack}>
                          <Text
                            style={{ color: theme.colors.primary }}
                            className="text-lg font-medium"
                          >
                            Done
                          </Text>
                        </TouchableOpacity>
                      ),
                    }}
                  />
                  <Stack.Screen
                    name="images/[post]"
                    options={{
                      presentation: "transparentModal",
                      headerShown: false,
                      animation: "none",
                      fullScreenGestureEnabled: false,
                      customAnimationOnGesture: true,
                    }}
                  />
                  <Stack.Screen
                    name="pro"
                    options={{
                      title: "",
                      headerTransparent: true,
                      presentation: "modal",
                      headerLeft: Platform.select({
                        ios: () => (
                          <TouchableOpacity onPress={handleModalBack}>
                            <Text className="text-lg text-white">Cancel</Text>
                          </TouchableOpacity>
                        ),
                      }),
                    }}
                  />
                  <Stack.Screen
                    name="composer"
                    options={{
                      headerShown: false,
                      presentation: "modal",
                    }}
                  />
                </Stack>
              </ListProvider>
            </ActionSheetProvider>
          </LogOutProvider>
        </AgentProvider>
        {/* </CustomerInfoProvider> */}
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

export default function RootLayout() {
  return (
    <TRPCProvider>
      <App />
    </TRPCProvider>
  );
}
