import { useEffect, useRef, useState } from "react";
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
import * as ScreenOrientation from "expo-screen-orientation";
import * as SplashScreen from "expo-splash-screen";
import { BskyAgent } from "@atproto/api";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { ThemeProvider } from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";

import { ListProvider } from "~/components/lists/context";
import { StatusBar } from "~/components/status-bar";
import { Toastable } from "~/components/toastable/toastable";
import { useOptionalAgent } from "~/lib/agent";
import { PreferencesProvider } from "~/lib/hooks/preferences";
import { CustomerInfoProvider, useConfigurePurchases } from "~/lib/purchases";
import { useQuickAction, useSetupQuickActions } from "~/lib/quick-actions";
import { useThemeSetup } from "~/lib/storage/app-preferences";
import { TRPCProvider } from "~/lib/utils/api";
import { fetchHandler } from "~/lib/utils/polyfills/fetch-polyfill";

BskyAgent.configure({ fetch: fetchHandler });

const routingInstrumentation = new Sentry.ReactNavigationInstrumentation();

Sentry.init({
  enabled: !__DEV__,
  debug: false,
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

function RootLayout() {
  useConfigurePurchases();
  useSentryTracing();
  useSetupQuickActions();

  const segments = useSegments();
  const router = useRouter();
  const theme = useThemeSetup();
  const agent = useOptionalAgent();
  const splashscreenHidden = useRef(false);
  const [ready, setReady] = useState(false);

  

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

  // redirect depending on login state
  useEffect(() => {
    if (!agent) return;
    const atRoot = segments.length === 0;

    if (agent.hasSession && atRoot) {
      console.log("redirecting to /feeds");
      router.replace("/(feeds)/feeds");
    }
  }, [segments, router, agent]);

  return (
    <TRPCProvider>
      <GestureHandlerRootView className="flex-1">
        <ThemeProvider value={theme}>
          <KeyboardProvider>
            <SafeAreaProvider>
              <StatusBar />
              {agent?.hasSession && <QuickActions />}
              <CustomerInfoProvider>
                <PreferencesProvider>
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
                        <Stack.Screen
                          name="edit-bio"
                          options={{
                            title: "Edit Profile",
                            presentation: "modal",
                          }}
                        />
                        <Stack.Screen
                          name="create-list"
                          options={{
                            title: "Create List",
                            presentation: "modal",
                          }}
                        />
                        <Stack.Screen
                          name="add-to-list/[handle]"
                          options={{
                            title: "Add to List",
                            presentation: "modal",
                          }}
                        />
                        <Stack.Screen
                          name="push-notifications"
                          options={{
                            title: "Push Notifications",
                            presentation: "modal",
                            headerShown: false,
                            headerTransparent: true,
                            gestureEnabled: false,
                          }}
                        />
                      </Stack>
                    </ListProvider>
                  </ActionSheetProvider>
                </PreferencesProvider>
              </CustomerInfoProvider>
              <Toastable />
            </SafeAreaProvider>
          </KeyboardProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
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
