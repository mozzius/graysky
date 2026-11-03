import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
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
import { type Client, type DidString, type HandleString } from "@atproto/lex";
import { type OAuthSession } from "@atproto/oauth-client-expo";
import { app, com } from "@bsky/sdk/lexicons";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import * as Sentry from "@sentry/react-native";
import { useQueryClient } from "@tanstack/react-query";
import { toast, Toaster } from "sonner-native";

import { ListProvider } from "~/components/lists/context";
import { StatusBar } from "~/components/status-bar";
import I18nProvider, { initializeI18n } from "~/i18n/config";
import {
  AgentProvider,
  AuthProvider,
  createAuthenticatedClient,
  publicClient,
  SessionProvider,
  type AuthContextValue,
  type SessionInfo,
} from "~/lib/agent";
import { PreferencesProvider } from "~/lib/hooks/preferences";
import {
  getOAuthClient,
  isOAuthCancellation,
  isSessionGoneError,
  onOAuthSessionDeleted,
} from "~/lib/oauth";
import { CustomerInfoProvider, useConfigurePurchases } from "~/lib/purchases";
import { useQuickAction, useSetupQuickActions } from "~/lib/quick-actions";
import {
  clearReauthDid,
  getActiveDid,
  getSavedSessions,
  markSignedOut,
  migrateLegacySessions,
  setActiveDid,
  setSavedSessions,
  type SavedSession,
} from "~/lib/session";
import { useThemeSetup } from "~/lib/storage/app-preferences";
import { TRPCProvider } from "~/lib/utils/api";
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

// password sessions from older versions get signed out here, and the landing
// page shows the "sign in again" screen. this runs before the first render
// because the landing page checks for that when it mounts, and its effects run
// before the root layout's
migrateLegacySessions();

interface ActiveSession {
  session: OAuthSession;
  client: Client;
  info: SessionInfo;
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
  // the session that's currently in use. updates from any other session (e.g.
  // one we switched away from) are ignored
  const currentSessionRef = useRef<Omit<ActiveSession, "info"> | null>(null);

  // close everything and go to the landing page, then open sign in for the
  // given account so they can get back in
  const promptSignIn = useCallback((did: string) => {
    const handle = getSavedSessions().find((s) => s.did === did)?.handle;
    if (routerRef.current.canDismiss()) {
      routerRef.current.dismissAll();
    }
    routerRef.current.replace("/");
    setTimeout(() => {
      routerRef.current.push(
        handle ? `/sign-in?handle=${encodeURIComponent(handle)}` : "/sign-in",
      );
    });
  }, []);

  // the oauth client deleted a session, e.g. its refresh token was revoked
  useEffect(() => {
    return onOAuthSessionDeleted((did) => {
      markSignedOut(did);
      if (currentSessionRef.current?.session.did !== did) return;
      currentSessionRef.current = null;
      setActiveDid(null);
      queryClient.clear();
      setAuth(null);
      toast.error(
        tRef.current(msg`Sorry! Your session expired. Please log in again.`),
      );
      promptSignIn(did);
    });
  }, [queryClient, promptSignIn]);

  // update the saved accounts list with the latest profile info
  const saveAccount = useCallback(async (did: DidString, client: Client) => {
    try {
      const profile = await client.call(app.bsky.actor.getProfile, {
        actor: did,
      });
      const account: SavedSession = {
        did,
        handle: profile.handle,
        avatar: profile.avatar,
        displayName: profile.displayName,
        signedOut: false,
      };
      setSavedSessions([
        account,
        ...getSavedSessions().filter((s) => s.did !== did),
      ]);
    } catch (err) {
      console.warn("failed to update saved sessions", err);
    }
  }, []);

  // make a session the current one
  const activateSession = useCallback(
    async (session: OAuthSession) => {
      const client = createAuthenticatedClient(session);
      const issuer = session.serverMetadata.issuer;
      const fetchInfo = async (): Promise<SessionInfo> => {
        const res = await client.call(com.atproto.server.getSession);
        return {
          did: session.did,
          handle: res.handle,
          email: res.email,
          emailConfirmed: res.emailConfirmed,
          issuer,
        };
      };

      // if we already know the handle, don't wait for the network
      const saved = getSavedSessions().find((s) => s.did === session.did);
      let info: SessionInfo;
      if (saved) {
        info = {
          did: session.did,
          handle: saved.handle as HandleString,
          issuer,
        };
        void fetchInfo()
          .then((fresh) =>
            setAuth((prev) =>
              prev?.session === session ? { ...prev, info: fresh } : prev,
            ),
          )
          .catch((err) => console.warn("failed to fetch session info", err));
      } else {
        info = await fetchInfo();
      }

      currentSessionRef.current = { session, client };
      setActiveDid(session.did);
      // signed in with oauth, so the "sign in again" screen isn't needed
      clearReauthDid();
      setAuth({ session, client, info });
      void saveAccount(session.did, client);
    },
    [saveAccount],
  );

  // Auth functions
  const signIn = useCallback(
    async (input: string, options?: { create?: boolean }) => {
      let session: OAuthSession;
      try {
        session = await getOAuthClient().signIn(
          input,
          options?.create ? { prompt: "create" } : undefined,
        );
      } catch (err) {
        if (isOAuthCancellation(err)) return false;
        throw err;
      }
      // Clear all cached data from the previous account
      queryClient.clear();
      await activateSession(session);
      return true;
    },
    [queryClient, activateSession],
  );

  const switchAccount = useCallback(
    async (did: string) => {
      let session: OAuthSession;
      try {
        session = await getOAuthClient().restore(did);
      } catch (err) {
        if (isSessionGoneError(err)) markSignedOut(did);
        throw err;
      }
      // Clear all cached data from the previous account
      queryClient.clear();
      await activateSession(session);
    },
    [queryClient, activateSession],
  );

  const refreshSession = useCallback(async () => {
    const current = currentSessionRef.current;
    if (!current) throw new Error("Not logged in");
    const res = await current.client.call(com.atproto.server.getSession);
    setAuth((prev) =>
      prev?.session === current.session
        ? {
            ...prev,
            info: {
              ...prev.info,
              handle: res.handle,
              email: res.email,
              emailConfirmed: res.emailConfirmed,
            },
          }
        : prev,
    );
  }, []);

  const logout = useCallback(() => {
    const current = currentSessionRef.current;
    currentSessionRef.current = null;
    if (current) {
      // revokes the tokens and deletes the stored session
      current.session.signOut().catch((err: unknown) => {
        console.warn("failed to sign out", err);
      });
      markSignedOut(current.session.did);
    }
    setActiveDid(null);
    queryClient.clear();
    setAuth(null);
    // Dismiss any modals and go to landing
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace("/");
  }, [queryClient, router]);

  const authValue = useMemo<AuthContextValue>(
    () => ({ signIn, switchAccount, refreshSession, logout }),
    [signIn, switchAccount, refreshSession, logout],
  );

  // Resume session on app launch
  useEffect(() => {
    if (resumingRef.current) return;
    resumingRef.current = true;

    const did = getActiveDid();
    if (did) {
      getOAuthClient()
        .restore(did)
        .then((session) => activateSession(session))
        .then(() => {
          router.replace("/(feeds)/feeds");
        })
        .catch((err: unknown) => {
          console.warn("failed to restore session", err);
          if (isSessionGoneError(err)) {
            markSignedOut(did);
            setActiveDid(null);
            toast.error(
              tRef.current(
                msg`Sorry! Your session expired. Please log in again.`,
              ),
            );
            promptSignIn(did);
          } else {
            // probably offline. keep the account active so the next launch
            // tries again
            toast.warning(
              tRef.current(
                msg`Could not connect to your account. Check your connection and try again.`,
              ),
            );
            router.replace("/");
          }
        })
        .finally(() => {
          setReady(true);
        });
    } else {
      setReady(true);
    }
  }, [activateSession, promptSignIn, router]);

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
                  <SessionProvider value={auth?.info ?? null}>
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
                              name="images/[post]"
                              options={{
                                headerShown: false,
                                // ios uses the zoom transition from
                                // Link.AppleZoom, which a custom animation
                                // would override. the gallery has its own
                                // swipe to close, so turn off the native
                                // zoom dismiss gesture to stop them fighting
                                ...Platform.select({
                                  ios: { gestureEnabled: false },
                                  default: {
                                    animation: "fade",
                                    animationMatchesGesture: true,
                                  },
                                }),
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
            <Toaster
              theme={theme.dark ? "dark" : "light"}
              position="top-center"
            />
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
