import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Text, TouchableOpacity } from "react-native";
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
import { useQueryClient } from "@tanstack/react-query";
import * as Sentry from "sentry-expo";

import { ListProvider } from "../components/lists/context";
import { AgentProvider } from "../lib/agent";
import {
  configureRevenueCat,
  CustomerInfoProvider,
  useCustomerInfoQuery,
} from "../lib/hooks/purchases";
import { LogOutProvider } from "../lib/log-out-context";
import { TRPCProvider } from "../lib/utils/api";
import { useColorScheme } from "../lib/utils/color-scheme";
import { fetchHandler } from "../lib/utils/polyfills/fetch-polyfill";

Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentry as string,
  enableInExpoDevelopment: true,
  debug: true, // If `true`, Sentry will try to print out useful debugging information if something goes wrong with sending the event. Set it to `false` in production
});

configureRevenueCat();

SplashScreen.preventAutoHideAsync();

const App = () => {
  const segments = useSegments();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AtpSessionData | null>(null);
  const [invalidator, setInvalidator] = useState(0);
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();

  const info = useCustomerInfoQuery();

  const agent = useMemo(() => {
    BskyAgent.configure({ fetch: fetchHandler });
    return new BskyAgent({
      service: "https://bsky.social",
      persistSession(evt: AtpSessionEvent, sess?: AtpSessionData) {
        // store the session-data for reuse
        switch (evt) {
          case "create":
            if (!sess) throw new Error("should be unreachable");
            void AsyncStorage.setItem("session", JSON.stringify(sess));
            setSession(sess);
            break;
          case "create-failed":
            void AsyncStorage.removeItem("session");
            setSession(null);
            Alert.alert(
              "Could not log you in",
              "Please check your details and try again",
            );
            break;
          case "update":
            if (!sess) throw new Error("should be unreachable");
            void AsyncStorage.setItem("session", JSON.stringify(sess));
            setSession(sess);
            break;
          case "expired":
            void AsyncStorage.removeItem("session");
            setSession(null);
            break;
        }
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidator]);

  useEffect(() => {
    AsyncStorage.getItem("session")
      .then(async (sess) => {
        if (sess) {
          const session = JSON.parse(sess) as AtpSessionData;
          await agent.resumeSession(session);
          setSession(session);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [agent]);

  const did = session?.did;

  // invalidate all queries when the session changes
  useEffect(() => {
    void queryClient.invalidateQueries();
  }, [did, queryClient]);

  // redirect depending on login state
  useEffect(() => {
    // early return if we're still loading
    if (loading) return;
    const atRoot = segments.length === 0;
    const inAuthGroup = segments[0] === "(auth)";

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !did &&
      !inAuthGroup &&
      !atRoot
    ) {
      // Redirect to the sign-in page.
      if (segments.join("/") === "(auth)/login") return;
      router.replace("/login");
    } else if (did && (inAuthGroup || atRoot)) {
      console.log("redirecting to feeds from:", segments);
      if (segments.join("/") === "(tabs)/(feeds)/feeds") return;
      router.replace("/feeds");
    }
  }, [did, segments, router, loading]);

  const logOut = useCallback(async () => {
    await AsyncStorage.removeItem("session");
    setSession(null);
    setInvalidator((i) => i + 1);
  }, []);

  const theme = colorScheme === "light" ? DefaultTheme : DarkTheme;

  const navigation = useNavigation();

  const isReady = !loading && !!info.data;

  useEffect(() => {
    if (isReady) {
      SplashScreen.hideAsync();
    }
  }, [isReady]);

  return (
    <ThemeProvider value={theme}>
      <SafeAreaProvider>
        <CustomerInfoProvider info={info.data}>
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
                      name="(auth)/login"
                      options={{ title: "Log in" }}
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
                          <TouchableOpacity
                            onPress={() => {
                              if (navigation.canGoBack()) {
                                router.push("../");
                              } else {
                                router.push("/feeds");
                              }
                            }}
                          >
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
                        headerShown: false,
                        presentation: "modal",
                      }}
                    />
                  </Stack>
                </ListProvider>
              </ActionSheetProvider>
            </LogOutProvider>
          </AgentProvider>
        </CustomerInfoProvider>
      </SafeAreaProvider>
      <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
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
