import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { showToastable } from "react-native-toastable";
import Constants from "expo-constants";
import * as Device from "expo-device";
import {
  Stack,
  useNavigationContainerRef,
  useRouter,
  useSegments,
} from "expo-router";
import { ThemeProvider } from "expo-router/react-navigation";
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { type Client } from "@atproto/lex";
import {
  PasswordSession,
  type PasswordSessionOptions,
  type SessionData,
} from "@atproto/lex-password-session";
import { app } from "@bsky/sdk/lexicons";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import * as Sentry from "@sentry/react-native";
import { useQueryClient } from "@tanstack/react-query";

import { ListProvider } from "~/components/lists/context";
import { StatusBar } from "~/components/status-bar";
import { Toastable } from "~/components/toastable/toastable";
import I18nProvider, { initializeI18n } from "~/i18n/config";
import {
  AgentProvider,
  AuthProvider,
  createClient,
  publicClient,
  SessionProvider,
  type AuthContextValue,
} from "~/lib/agent";
import { PreferencesProvider } from "~/lib/hooks/preferences";
import { CustomerInfoProvider, useConfigurePurchases } from "~/lib/purchases";
import { useQuickAction, useSetupQuickActions } from "~/lib/quick-actions";
import {
  getSavedSessions,
  getStoredSession,
  isSessionData,
  setSavedSessions,
  setStoredSession,
  toSessionData,
  type SavedSession,
  type StoredSessionData,
} from "~/lib/session";
import { useThemeSetup } from "~/lib/storage/app-preferences";
import { store } from "~/lib/storage/storage";
import { TRPCProvider } from "~/lib/utils/api";
import { resolvePdsFromDid, resolvePdsUrl } from "~/lib/utils/resolve-pds";
import { isIOS26 } from "~/lib/utils/version";

const routingInstrumentation = Sentry.reactNavigationIntegration();

Sentry.init({
  enabled: !__DEV__,
  debug: false,
  // not a secret, but allow override
  dsn:
    (Constants.expoConfig?.extra?.sentry as string) ??
    "https://76421919ff114625bfd275af5f843452@o4505343214878720.ingest.sentry.io/4505478653739008",
  ignoreErrors: [
    // https://graysky.sentry.io/issues/4916862074/?project=4505478653739008&query=is%3Aunresolved&referrer=issue-stream&statsPeriod=14d&stream_index=0
    "viewNotFoundForReactTag",
    // https://graysky.sentry.io/issues/4677582595/?project=4505478653739008&query=is%3Aunresolved&referrer=issue-stream&statsPeriod=14d&stream_index=1
    "nilReactBridge",
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

initializeI18n();

interface ActiveSession {
  session: PasswordSession;
  client: Client;
  data: SessionData;
}

const App = () => {
  const segments = useSegments();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [ready, setReady] = useState(false);
  const [auth, setAuth] = useState<ActiveSession | null>(null);
  const theme = useThemeSetup();
  const { _ } = useLingui();
  const tRef = useRef(_);
  tRef.current = _;
  const routerRef = useRef(router);
  routerRef.current = router;
  const resumingRef = useRef(false);
  // the session that's currently in use. session callbacks from any other
  // session (e.g. one we switched away from) are ignored
  const currentSessionRef = useRef<Omit<ActiveSession, "data"> | null>(null);

  // Save session to storage and update saved sessions list
  const saveSessionToStorage = useCallback(
    (sess: SessionData, client: Client) => {
      setStoredSession(sess);
      // Update saved sessions list with profile info
      void client
        .call(app.bsky.actor.getProfile, { actor: sess.did })
        .then((profile) => {
          const newSession: SavedSession = {
            session: sess,
            did: sess.did,
            handle: profile.handle,
            avatar: profile.avatar,
            displayName: profile.displayName,
            pdsUrl: sess.service,
            signedOut: false,
          };
          setSavedSessions([
            newSession,
            ...getSavedSessions().filter((s) => s.did !== sess.did),
          ]);
        })
        .catch((err) => {
          console.warn("failed to update saved sessions", err);
        });
    },
    [],
  );

  // Helper to handle session expiry
  const handleSessionExpired = useCallback(() => {
    currentSessionRef.current = null;
    store.remove("session");
    showToastable({
      message: tRef.current(
        msg`Sorry! Your session expired. Please log in again.`,
      ),
    });
    setAuth(null);
    // Dismiss any modals and go to landing
    if (routerRef.current.canDismiss()) {
      routerRef.current.dismissAll();
    }
    routerRef.current.replace("/");
  }, []);

  const sessionOptions = useMemo<PasswordSessionOptions>(
    () => ({
      onUpdated(data) {
        // these callbacks must not throw
        try {
          const current = currentSessionRef.current;
          if (current?.session !== this) return;
          saveSessionToStorage(data, current.client);
          setAuth((prev) =>
            prev?.session === this ? { ...prev, data } : prev,
          );
        } catch (err) {
          console.error("failed to persist session", err);
        }
      },
      onDeleted() {
        try {
          if (currentSessionRef.current?.session !== this) return;
          handleSessionExpired();
        } catch (err) {
          console.error("failed to handle session expiry", err);
        }
      },
      onUpdateFailure(_data, err) {
        // network error or similar - the session might still be valid
        console.warn("failed to refresh session", err);
      },
    }),
    [saveSessionToStorage, handleSessionExpired],
  );

  // make a session the current one
  const activateSession = useCallback(
    (session: PasswordSession) => {
      const client = createClient(session);
      currentSessionRef.current = { session, client };
      const data = session.session;
      setAuth({ session, client, data });
      saveSessionToStorage(data, client);
    },
    [saveSessionToStorage],
  );

  // Auth functions
  const login = useCallback(
    async (identifier: string, password: string, authFactorToken?: string) => {
      // Resolve the PDS URL from the handle
      const pdsUrl = await resolvePdsUrl(identifier);

      const session = await PasswordSession.login({
        service: pdsUrl,
        identifier,
        password,
        authFactorToken,
        ...sessionOptions,
      });

      activateSession(session);
    },
    [sessionOptions, activateSession],
  );

  const resumeSession = useCallback(
    async (stored: StoredSessionData, pdsUrl?: string) => {
      // legacy sessions don't have a service url. use the provided PDS URL,
      // or resolve it from the DID as a fallback
      const data = isSessionData(stored)
        ? stored
        : toSessionData(
            stored,
            pdsUrl ?? (await resolvePdsFromDid(stored.did)),
          );

      // refreshes the session. only throws if the session is definitely
      // invalid - network errors go to `onUpdateFailure`
      const session = await PasswordSession.resume(data, sessionOptions);

      activateSession(session);
    },
    [sessionOptions, activateSession],
  );

  const refreshSession = useCallback(async () => {
    if (!auth) throw new Error("Not logged in");
    // `onUpdated` will save and update the session data
    await auth.session.refresh();
  }, [auth]);

  const currentDid = auth?.data.did;

  const logout = useCallback(() => {
    // Mark current session as signed out in saved sessions
    if (currentDid) {
      setSavedSessions(
        getSavedSessions().map((s) =>
          s.did === currentDid ? { ...s, signedOut: true } : s,
        ),
      );
    }
    currentSessionRef.current = null;
    store.remove("session");
    queryClient.clear();
    setAuth(null);
    // Dismiss any modals and go to landing
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace("/");
  }, [currentDid, queryClient, router]);

  const authValue = useMemo<AuthContextValue>(
    () => ({ login, resumeSession, refreshSession, logout }),
    [login, resumeSession, refreshSession, logout],
  );

  // Resume session on app launch
  useEffect(() => {
    if (resumingRef.current) return;
    resumingRef.current = true;

    const stored = getStoredSession();
    if (stored) {
      resumeSession(stored.session, stored.pdsUrl)
        .then(() => {
          router.replace("/(feeds)/feeds");
        })
        .catch(() => {
          showToastable({
            message: tRef.current(
              msg`Sorry! Your session expired. Please log in again.`,
            ),
          });
          store.remove("session");
          router.replace("/");
        })
        .finally(() => {
          setReady(true);
        });
    } else {
      setReady(true);
    }
  }, [resumeSession, router]);

  const isLoggedIn = !!auth;

  // Redirect depending on login state
  useEffect(() => {
    if (!ready) return;
    // @ts-expect-error type is overly specific
    const atRoot = segments.length === 0;
    const inAuthGroup = segments[0] === "(auth)";

    // Never interfere with auth group - let those pages handle their own navigation
    if (inAuthGroup) return;

    // Redirect to landing if not logged in and trying to access protected routes
    if (!isLoggedIn && !atRoot) {
      console.log("redirecting to /");
      router.replace("/");
    }
    // Redirect to feeds if at root with session (initial app launch)
    else if (isLoggedIn && atRoot) {
      console.log("redirecting to /feeds");
      router.replace("/(feeds)/feeds");
    }
  }, [segments, router, isLoggedIn, ready]);

  const splashscreenHidden = useRef(false);

  useEffect(() => {
    if (splashscreenHidden.current) return;
    if (ready) {
      void SplashScreen.hideAsync()
        .catch(() => console.warn)
        .then(() => Device.getDeviceTypeAsync())
        .then((type) => {
          if (type === Device.DeviceType.TABLET) {
            void ScreenOrientation.unlockAsync();
          }
        });
      splashscreenHidden.current = true;
    }
  }, [ready]);

  // needs i18n context
  useSetupQuickActions();

  return (
    <GestureHandlerRootView className="flex-1">
      <ThemeProvider value={theme}>
        <StatusBar style="auto" applyToNavigationBar />
        <KeyboardProvider>
          <SafeAreaProvider>
            {isLoggedIn && <QuickActions />}
            <CustomerInfoProvider>
              <AuthProvider value={authValue}>
                <AgentProvider value={auth?.client ?? publicClient}>
                  <SessionProvider value={auth?.data ?? null}>
                    <PreferencesProvider>
                      <ActionSheetProvider>
                        <ListProvider>
                          <Stack>
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
                                contentStyle: {
                                  height: "100%",
                                },
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
                                animationMatchesGesture: true,
                              }}
                            />
                            <Stack.Screen
                              name="discover"
                              options={{
                                title: _(msg`Discover Feeds`),
                                presentation: "modal",
                                headerLargeTitle: true,
                                headerLargeTitleShadowVisible: !isIOS26,
                                headerTransparent: isIOS26,
                                headerLargeStyle: {
                                  backgroundColor: isIOS26
                                    ? "transparent"
                                    : theme.colors.background,
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
                              name="circle"
                              options={{
                                title: _(msg`My Circle`),
                                headerTransparent: true,
                                presentation: "modal",
                              }}
                            />
                            <Stack.Screen
                              name="success"
                              options={{
                                title: _(msg`Purchase Successful`),
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
                                    contentStyle: {
                                      height: "100%",
                                    },
                                  },
                                  android: {
                                    animation: "fade_from_bottom",
                                  },
                                }),
                              }}
                            />
                            <Stack.Screen
                              name="edit-bio"
                              options={{
                                title: _(msg`Edit Profile`),
                                ...Platform.select({
                                  ios: {
                                    presentation: "modal",
                                    headerTransparent: true,
                                    headerShadowVisible: true,
                                    headerBlurEffect: !isIOS26
                                      ? theme.dark
                                        ? "systemThickMaterialDark"
                                        : "systemChromeMaterialLight"
                                      : undefined,
                                    headerStyle: {
                                      backgroundColor: !isIOS26
                                        ? theme.dark
                                          ? "rgba(0,0,0,0.4)"
                                          : "rgba(255,255,255,0.1)"
                                        : undefined,
                                    },
                                  },
                                }),
                              }}
                            />
                            <Stack.Screen
                              name="create-list"
                              options={{
                                title: _(msg`Create List`),
                                presentation: "modal",
                              }}
                            />
                            <Stack.Screen
                              name="add-to-list/[handle]"
                              options={{
                                title: _(msg`Add to List`),
                                presentation: "modal",
                              }}
                            />
                            <Stack.Screen
                              name="push-notifications"
                              options={{
                                title: _(msg`Push Notifications`),
                                presentation: "modal",
                                headerShown: false,
                                headerTransparent: true,
                                gestureEnabled: false,
                              }}
                            />
                            <Stack.Screen
                              name="capture/[author]/[post]"
                              options={{
                                title: _(msg`Share as Image`),
                                presentation: "formSheet",
                              }}
                            />
                          </Stack>
                        </ListProvider>
                      </ActionSheetProvider>
                    </PreferencesProvider>
                  </SessionProvider>
                </AgentProvider>
              </AuthProvider>
            </CustomerInfoProvider>
            <Toastable />
          </SafeAreaProvider>
        </KeyboardProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
};

// keeps the tabs underneath modals (settings, composer etc) when deep linking
export const unstable_settings = {
  anchor: "(tabs)",
};

function RootLayout() {
  useConfigurePurchases();
  useSentryTracing();

  return (
    <I18nProvider>
      <TRPCProvider>
        <App />
      </TRPCProvider>
    </I18nProvider>
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
