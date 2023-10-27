import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogBox, Platform, TouchableOpacity } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { showToastable } from "react-native-toastable";
import Constants from "expo-constants";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useColorScheme } from "nativewind";
import { type ColorSchemeSystem } from "nativewind/dist/style-sheet/color-scheme";
import * as Sentry from "sentry-expo";
import { z } from "zod";

import { ListProvider } from "~/components/lists/context";
import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/text";
import { Toastable } from "~/components/toastable/toastable";
import { AgentProvider } from "~/lib/agent";
import { PreferencesProvider } from "~/lib/hooks/preferences";
// import {
//   configureRevenueCat,
//   CustomerInfoProvider,
//   useCustomerInfoQuery,
// } from "~/lib/hooks/purchases";
import { LogOutProvider } from "~/lib/log-out-context";
import { store } from "~/lib/storage";
import { TRPCProvider } from "~/lib/utils/api";
import { fetchHandler } from "~/lib/utils/polyfills/fetch-polyfill";
import { type SavedSession } from "../components/switch-accounts";

Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentry as string,
  enableInExpoDevelopment: false,
  integrations: [new Sentry.Native.ReactNativeTracing()],
});

// configureRevenueCat();

SplashScreen.preventAutoHideAsync();

// absolutely no idea where this is coming from
LogBox.ignoreLogs([
  "The `redirect` prop on <Screen /> is deprecated and will be removed. Please use `router.redirect` instead",
]);

interface Props {
  session: AtpSessionData | null;
  saveSession: (sess: AtpSessionData | null, agent?: BskyAgent) => void;
}

const App = ({ session, saveSession }: Props) => {
  const segments = useSegments();
  const router = useRouter();

  const [invalidator, setInvalidator] = useState(0);
  const { colorScheme } = useColorScheme();
  const queryClient = useQueryClient();

  // const info = useCustomerInfoQuery();

  const [agentUpdate, setAgentUpdate] = useState(0);

  const agent = useMemo(() => {
    BskyAgent.configure({ fetch: fetchHandler });
    return new BskyAgent({
      service: "https://bsky.social",
      persistSession(evt: AtpSessionEvent, sess?: AtpSessionData) {
        switch (evt) {
          case "create":
          case "update":
            if (!sess) throw new Error("should be unreachable");
            saveSession(sess, agent);
            break;
          case "expired":
            saveSession(null);
            showToastable({
              message: "Sorry! Your session expired. Please log in again.",
            });
            break;
        }
        // force a re-render of things that use the agent
        setAgentUpdate((prev) => prev + 1);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invalidator, saveSession]);

  const resumeSession = useMutation({
    mutationFn: async (sess: AtpSessionData) => {
      await agent.resumeSession(sess);
    },
    retry: 3,
    onError: () => {
      showToastable({
        message: "Sorry! Your session expired. Please log in again.",
      });
      router.replace("/");
    },
  });

  const tryResumeSession = !agent.hasSession && !!session;
  const onceRef = useRef(false);

  useEffect(() => {
    if (tryResumeSession && !resumeSession.isLoading) {
      if (!onceRef.current) {
        onceRef.current = true;
        resumeSession.mutate(session);
        setTimeout(() => {
          router.replace("/feeds");
        });
      }
    }
  }, [session, agent, tryResumeSession, resumeSession, router]);

  // redirect depending on login state
  useEffect(() => {
    if (resumeSession.isLoading) return;
    const atRoot = segments.length === 0;
    const inAuthGroup = segments[0] === "(auth)";

    if (
      // If the user is not signed in and the initial segment is not anything in the auth group.
      !agent.hasSession &&
      !inAuthGroup &&
      !atRoot
    ) {
      // Redirect to the sign-in page.
      console.log("redirecting to /");
      router.replace("/");
    } else if (agent.hasSession && (inAuthGroup || atRoot)) {
      console.log("redirecting to /feeds");
      router.replace("/feeds");
    }
  }, [segments, router, agent.hasSession, resumeSession.isLoading]);

  const logOut = useCallback(() => {
    const sessions = store.getString("sessions");
    if (sessions) {
      const old = JSON.parse(sessions) as SavedSession[];
      const newSessions = old.map((s) => {
        if (s.did === session?.did) {
          return {
            ...s,
            signedOut: true,
          };
        }
        return s;
      });
      store.set("sessions", JSON.stringify(newSessions));
    }

    saveSession(null);
    queryClient.clear();
    setInvalidator((i) => i + 1);
  }, [queryClient, saveSession, session?.did]);

  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    void AsyncStorage.getItem("color-scheme").then((value) => {
      const scheme = z.enum(["light", "dark", "system"]).safeParse(value);
      if (scheme.success) {
        setColorScheme(scheme.data);
      } else {
        void AsyncStorage.setItem(
          "color-scheme",
          "system" satisfies ColorSchemeSystem,
        );
      }
    });
  }, [setColorScheme]);

  const theme = colorScheme === "light" ? DefaultTheme : DarkTheme;

  useEffect(() => {
    setTimeout(() => {
      SplashScreen.hideAsync();
    }, 100);
  }, []);

  // const cancelButton = useCallback(
  //   () =>
  //     Platform.select({
  //       ios: (
  //         <TouchableOpacity
  //           onPress={() =>
  //             router.canGoBack() ? router.push("../") : router.push("/feeds")
  //           }
  //         >
  //           <Text className="text-lg text-white">Cancel</Text>
  //         </TouchableOpacity>
  //       ),
  //     }),
  //   [router],
  // );

  const doneButton = useCallback(
    () =>
      Platform.select({
        ios: (
          <TouchableOpacity
            onPress={() =>
              router.canGoBack() ? router.push("../") : router.push("/feeds")
            }
          >
            <Text
              style={{ color: theme.colors.primary }}
              className="text-lg font-medium"
            >
              Done
            </Text>
          </TouchableOpacity>
        ),
        default: null,
      }),
    [router, theme.colors.primary],
  );

  // SENTRY NAVIGATION LOGGING
  const routeName = "/" + segments.join("/");

  const transaction = useRef<ReturnType<
    typeof Sentry.Native.startTransaction
  > | null>(null); // Can't find Transaction type
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      transaction.current?.finish?.();
      transaction.current = null;
    }, 3000);

    transaction.current?.finish?.();
    transaction.current = Sentry.Native.startTransaction({
      // Transaction params are similar to those in @sentry/react-native
      name: "Route Change",
      op: "navigation",
      tags: {
        "routing.route.name": routeName,
      },
    });

    return () => {
      transaction.current?.finish?.();
      transaction.current = null;
      if (timer.current) clearTimeout(timer.current);
    };
  }, [routeName]);

  return (
    <ThemeProvider value={theme}>
      <StatusBar />
      <SafeAreaProvider>
        <KeyboardProvider>
          {/* <CustomerInfoProvider info={info.data}> */}
          <AgentProvider agent={agent} update={agentUpdate}>
            <PreferencesProvider>
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
                          gestureEnabled: false,
                        }}
                      />
                      <Stack.Screen
                        name="(auth)"
                        options={{
                          headerShown: false,
                          presentation: "formSheet",
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
                          headerRight: doneButton,
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
                      {/* <Stack.Screen
                        name="pro"
                        options={{
                          title: "",
                          headerTransparent: true,
                          presentation: "modal",
                          headerLeft,
                        }}
                      /> */}
                      <Stack.Screen
                        name="composer"
                        options={{
                          headerShown: false,
                          ...Platform.select({
                            ios: {
                              presentation: "formSheet",
                            },
                            android: {
                              animation: "fade_from_bottom",
                            },
                          }),
                        }}
                      />
                    </Stack>
                  </ListProvider>
                </ActionSheetProvider>
              </LogOutProvider>
            </PreferencesProvider>
          </AgentProvider>
          {/* </CustomerInfoProvider> */}
        </KeyboardProvider>
        <Toastable />
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

const getSession = () => {
  const raw = store.getString("session");
  if (!raw) return null;
  const session = JSON.parse(raw) as AtpSessionData;
  return session;
};

export default function RootLayout() {
  const [session, setSession] = useState(() => getSession());

  const saveSession = useCallback(
    (sess: AtpSessionData | null, agent?: BskyAgent) => {
      setSession(sess);
      if (sess) {
        store.set("session", JSON.stringify(sess));
        if (agent) {
          void agent.getProfile({ actor: sess.did }).then((res) => {
            if (res.success) {
              const sessions = store.getString("sessions");
              if (sessions) {
                const old = JSON.parse(sessions) as SavedSession[];
                const newSessions = [
                  {
                    session: sess,
                    did: sess.did,
                    handle: res.data.handle,
                    avatar: res.data.avatar,
                    displayName: res.data.displayName,
                    signedOut: false,
                  },
                  ...old.filter((s) => s.did !== sess.did),
                ];
                store.set("sessions", JSON.stringify(newSessions));
              } else {
                store.set(
                  "sessions",
                  JSON.stringify([
                    {
                      session: sess,
                      did: sess.did,
                      handle: res.data.handle,
                      avatar: res.data.avatar,
                      displayName: res.data.displayName,
                      signedOut: false,
                    },
                  ] satisfies SavedSession[]),
                );
              }
            }
          });
        }
      } else {
        store.delete("session");
      }
    },
    [],
  );

  return (
    <TRPCProvider>
      <App session={session} saveSession={saveSession} />
    </TRPCProvider>
  );
}
