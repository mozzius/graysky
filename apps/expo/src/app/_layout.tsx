import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
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
import { QueryClientProvider } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";

import { ListProvider } from "../components/lists/context";
import { AgentProvider } from "../lib/agent";
import { LogOutProvider } from "../lib/log-out-context";
import { queryClient } from "../lib/query-client";
import { fetchHandler } from "../lib/utils/polyfills/fetch-polyfill";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const segments = useSegments();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AtpSessionData | null>(null);
  const [invalidator, setInvalidator] = useState(0);
  const { colorScheme } = useColorScheme();

  // need to implement this
  // https://expo.github.io/router/docs/features/routing#shared-routes

  const agent = useMemo(() => {
    BskyAgent.configure({ fetch: fetchHandler });
    return new BskyAgent({
      service: "https://bsky.social/",
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
  }, [did]);

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
      router.replace("/login");
    } else if (did && (inAuthGroup || atRoot)) {
      // Redirect away from the sign-in page.
      router.replace("/skyline");
    }
  }, [did, segments, router, loading]);

  const logOut = useCallback(async () => {
    await AsyncStorage.removeItem("session");
    setSession(null);
    setInvalidator((i) => i + 1);
  }, []);

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync();
  }, [loading]);

  const theme = colorScheme === "light" ? DefaultTheme : DarkTheme;
  return (
    <ThemeProvider value={theme}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <AgentProvider value={agent}>
            <StatusBar style={colorScheme === "light" ? "dark" : "light"} />
            <LogOutProvider value={logOut}>
              <ActionSheetProvider>
                <ListProvider>
                  <Stack
                    screenOptions={{
                      headerShown: true,
                      fullScreenGestureEnabled: true,
                      headerStyle: {
                        backgroundColor:
                          colorScheme === "light" ? "#fff" : "#000",
                      },
                    }}
                  >
                    <Stack.Screen name="login" options={{ title: "Log in" }} />
                    <Stack.Screen
                      name="settings/index"
                      options={{
                        headerTitle: "Settings",
                      }}
                    />
                    <Stack.Screen
                      name="settings/account/index"
                      options={{
                        headerTitle: "Account Settings",
                      }}
                    />
                    <Stack.Screen
                      name="settings/account/edit-bio"
                      options={{
                        headerTitle: "Edit Bio",
                      }}
                    />
                    <Stack.Screen
                      name="settings/account/change-handle"
                      options={{
                        headerTitle: "Change Handle",
                      }}
                    />
                    <Stack.Screen
                      name="settings/content-moderation"
                      options={{
                        headerTitle: "Content Moderation",
                      }}
                    />
                    <Stack.Screen
                      name="settings/app"
                      options={{
                        headerTitle: "App Settings",
                      }}
                    />
                    <Stack.Screen
                      name="translate"
                      options={{
                        headerTitle: "Translate",
                        presentation: "modal",
                      }}
                    />
                  </Stack>
                </ListProvider>
              </ActionSheetProvider>
            </LogOutProvider>
          </AgentProvider>
        </SafeAreaProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
