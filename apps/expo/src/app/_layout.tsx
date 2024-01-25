import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { showToastable } from "react-native-toastable";
import Constants from "expo-constants";
import {
  Stack,
  useNavigationContainerRef,
  useRouter,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import {
  BskyAgent,
  type AtpSessionData,
  type AtpSessionEvent,
} from "@atproto/api";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import * as Sentry from "@sentry/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { ListProvider } from "~/components/lists/context";
import { StatusBar } from "~/components/status-bar";
import { type SavedSession } from "~/components/switch-accounts";
import { Toastable } from "~/components/toastable/toastable";
import { AgentProvider } from "~/lib/agent";
import {
  AppPreferencesProvider,
  PreferencesProvider,
} from "~/lib/hooks/preferences";
import { LogOutProvider } from "~/lib/log-out-context";
import { CustomerInfoProvider, useConfigurePurchases } from "~/lib/purchases";
import { useQuickAction, useSetupQuickActions } from "~/lib/quick-actions";
import { store } from "~/lib/storage";
import { TRPCProvider } from "~/lib/utils/api";
import { fetchHandler } from "~/lib/utils/polyfills/fetch-polyfill";

const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

Sentry.init({
  debug: __DEV__,
  // not a secret, but allow override
  dsn:
    (Constants.expoConfig?.extra?.sentry as string) ??
    "https://76421919ff114625bfd275af5f843452@o4505343214878720.ingest.sentry.io/4505478653739008",
  integrations: [
    new Sentry.ReactNativeTracing({
      routingInstrumentation,
    }),
  ],
});

const useSentryTracing = () => {
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref) {
      routingInstrumentation.registerNavigationContainer(ref);
    }
  }, [ref]);
};

void SplashScreen.preventAutoHideAsync();

// seems to cause crash - TODO: investigate
// void Device.getDeviceTypeAsync().then((type) => {
//   if (type === Device.DeviceType.TABLET) {
//     void ScreenOrientation.unlockAsync();
//   }
// });

const App = () => {
  const segments = useSegments();
  const router = useRouter();
  const [invalidator, setInvalidator] = useState(0);
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [agentUpdate, setAgentUpdate] = useState(0);
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
  const { mutate: resumeSessionMutate, isPending: isResuming } = resumeSession;
  const onceRef = useRef(false);

  useEffect(() => {
    if (tryResumeSession) {
      if (isResuming) return;
      if (!onceRef.current) {
        onceRef.current = true;
        resumeSessionMutate(session);
        setTimeout(() => {
          router.replace("/(feeds)/feeds");
          setReady(true);
        });
      }
    } else {
      setReady(true);
    }
  }, [session, tryResumeSession, isResuming, router, resumeSessionMutate]);

  // redirect depending on login state
  useEffect(() => {
    if (resumeSession.isPending) return;
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
    } else if (agent.hasSession && atRoot) {
      console.log("redirecting to /feeds");
      router.replace("/(feeds)/feeds");
    }
  }, [segments, router, agent.hasSession, resumeSession.isPending]);

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

  const splashscreenHidden = useRef(false);

  useEffect(() => {
    if (splashscreenHidden.current) return;
    if (ready) {
      void SplashScreen.hideAsync().catch(() => console.warn);
      splashscreenHidden.current = true;
    }
  }, [ready]);

  return (
    <GestureHandlerRootView className="flex-1">
      <KeyboardProvider>
        <AppPreferencesProvider>
          {(theme) => (
            <SafeAreaProvider>
              <StatusBar />
              {agent.hasSession && <QuickActions />}
              <CustomerInfoProvider>
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
                              name="images/[post]"
                              options={{
                                headerShown: false,
                                animation: "fade",
                                fullScreenGestureEnabled: false,
                                customAnimationOnGesture: true,
                              }}
                            />
                            <Stack.Screen
                              name="discover"
                              options={{
                                title: "Discover Feeds",
                                presentation: "modal",
                                headerLargeTitle: true,
                                headerLargeTitleShadowVisible: false,
                                headerLargeStyle: {
                                  backgroundColor: theme.colors.background,
                                },
                                headerSearchBarOptions: {},
                              }}
                            />
                            <Stack.Screen
                              name="pro"
                              options={{
                                title: "",
                                headerTransparent: true,
                                presentation: "modal",
                              }}
                            />
                            <Stack.Screen
                              name="success"
                              options={{
                                title: "Purchase Successful",
                                headerShown: false,
                                presentation: "modal",
                              }}
                            />
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
              </CustomerInfoProvider>
              <Toastable />
            </SafeAreaProvider>
          )}
        </AppPreferencesProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
};

const getSession = () => {
  const raw = store.getString("session");
  if (!raw) return null;
  const session = JSON.parse(raw) as AtpSessionData;
  return session;
};

function RootLayout() {
  useConfigurePurchases();
  useSentryTracing();
  useSetupQuickActions();

  return (
    <TRPCProvider>
      <App />
    </TRPCProvider>
  );
}

export default Sentry.wrap(RootLayout);

const QuickActions = () => {
  const fired = useRef<string | null>(null);
  const router = useRouter();
  const action = useQuickAction();

  const href = action?.params?.href;

  useEffect(() => {
    if (typeof href !== "string" || fired.current === href) return;
    fired.current = href;
    router.push(href);
  }, [href, router]);

  return null;
};
