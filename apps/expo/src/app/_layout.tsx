import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Linking, Platform, Text, TouchableOpacity } from "react-native";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
  BskyAgent,
  type AtpSessionData,
  type AtpSessionEvent,
} from "@atproto/api";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { store } from "../lib/storage";
import { TRPCProvider } from "../lib/utils/api";
import { fetchHandler } from "../lib/utils/polyfills/fetch-polyfill";

Sentry.init({
  dsn: Constants.expoConfig?.extra?.sentry as string,
  enableInExpoDevelopment: false,
});

// configureRevenueCat();

SplashScreen.preventAutoHideAsync();

interface Props {
  session: AtpSessionData | null;
  saveSession: (sess: AtpSessionData | null) => void;
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
    console.info("creating agent", invalidator);
    return new BskyAgent({
      service: "https://bsky.social",
      persistSession(evt: AtpSessionEvent, sess?: AtpSessionData) {
        switch (evt) {
          case "create":
            if (!sess) throw new Error("should be unreachable");
            saveSession(sess);
            break;
          case "create-failed":
            break;
          case "update":
            if (!sess) throw new Error("should be unreachable");
            saveSession(sess);
            break;
          case "expired":
            saveSession(null);
            break;
        }
        // force a re-render of things that use the agent
        setAgentUpdate((prev) => prev + 1);
      },
    });
  }, [invalidator, saveSession]);

  const resumeSession = useMutation({
    mutationFn: async (sess: AtpSessionData) => {
      await agent.resumeSession(sess);
    },
    retry: 3,
    onError: () => router.replace("/"),
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
      if (segments.join("/") === "(auth)/login") return;
      console.log("redirecting to /");
      router.replace("/");
    } else if (agent.hasSession && (inAuthGroup || atRoot)) {
      if (segments.join("/") === "(tabs)/(feeds)/feeds") return;
      console.log("redirecting to /feeds");
      router.replace("/feeds");
    }
  }, [segments, router, agent.hasSession, resumeSession.isLoading]);

  const logOut = useCallback(() => {
    saveSession(null);
    queryClient.clear();
    setInvalidator((i) => i + 1);
  }, [queryClient, saveSession]);

  const theme = colorScheme === "light" ? DefaultTheme : DarkTheme;

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  function handleModalBack() {
    router.canGoBack() ? router.push("../") : router.push("/feeds");
  }

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={theme.dark ? "light" : "dark"} />
      <SafeAreaProvider>
        <KeyboardProvider>
          {/* <CustomerInfoProvider info={info.data}> */}
          <AgentProvider agent={agent} update={agentUpdate}>
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
                            onPress={() =>
                              void Linking.openURL("https://bsky.app")
                            }
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
                        headerRight: Platform.select({
                          ios: () => (
                            <TouchableOpacity onPress={handleModalBack}>
                              <Text
                                style={{ color: theme.colors.primary }}
                                className="text-lg font-medium"
                              >
                                Done
                              </Text>
                            </TouchableOpacity>
                          ),
                        }),
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
          </AgentProvider>
          {/* </CustomerInfoProvider> */}
        </KeyboardProvider>
      </SafeAreaProvider>
    </ThemeProvider>
  );
};

const getSession = () => {
  const raw = store.getString("session");
  if (!raw) return null;
  return JSON.parse(raw) as AtpSessionData;
};

export default function RootLayout() {
  const [session, setSession] = useState(() => getSession());

  const saveSession = useCallback((sess: AtpSessionData | null) => {
    setSession(sess);
    if (sess) {
      store.set("session", JSON.stringify(sess));
    } else {
      store.delete("session");
    }
  }, []);

  return (
    <TRPCProvider>
      <App session={session} saveSession={saveSession} />
    </TRPCProvider>
  );
}
