import { useCallback, useRef, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { Stack, usePathname, useRouter, useSegments } from "expo-router";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import colors from "tailwindcss/colors";

import { BackButtonOverride } from "~/components/back-button-override";
import { Tabs } from "~/components/bottom-tabs";
import { DrawerProvider } from "~/components/drawer/context";
import { DrawerContent } from "~/components/drawer/drawer-content";
import { StatusBar } from "~/components/status-bar";
import { SwitchAccounts } from "~/components/switch-accounts";
import { Text } from "~/components/themed/text";
import { useOptionalAgent } from "~/lib/agent";
import { useBottomSheetStyles } from "~/lib/bottom-sheet";
import { useNotifications } from "~/lib/hooks/notifications";
import { useHaptics } from "~/lib/hooks/preferences";
import { useHomepage } from "~/lib/storage/app-preferences";
import { useRefreshOnFocus } from "~/lib/utils/query";

export default function AppLayout() {
  // agent might not be available yet
  const agent = useOptionalAgent();
  const [open, setOpen] = useState(false);
  const { _ } = useLingui();

  useNotifications();

  const notifications = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      if (!agent?.hasSession) return null;
      const unreadCount = await agent.countUnreadNotifications();
      if (!unreadCount.success)
        throw new Error("Failed to fetch notifications");
      await Notifications.setBadgeCountAsync(
        Math.min(unreadCount.data.count, 30),
      );
      return unreadCount.data;
    },
    // refetch every 15 seconds
    refetchInterval: 1000 * 15,
  });

  useRefreshOnFocus(notifications.refetch);

  const renderDrawerContent = useCallback(
    () => <DrawerContent open={open} />,
    [open],
  );

  const openDrawer = useCallback((open = true) => setOpen(open), []);

  const onOpen = useCallback(() => setOpen(true), []);
  const onClose = useCallback(() => setOpen(false), []);

  const theme = useTheme();
  const segments = useSegments();
  const pathname = usePathname();
  const router = useRouter();

  const homepage = useHomepage();

  const accountRef = useRef<BottomSheetModal>(null);
  const { top } = useSafeAreaInsets();
  const {
    backgroundStyle,
    handleStyle,
    handleIndicatorStyle,
    contentContainerStyle,
  } = useBottomSheetStyles();
  const haptics = useHaptics();
  const dimensions = useWindowDimensions();

  const dismissSheet = useCallback(() => accountRef.current?.dismiss(), []);

  const reducedMotion = useReducedMotion();

  return (
    <DrawerProvider value={openDrawer}>
      <BottomSheetModal
        ref={accountRef}
        enablePanDownToClose
        snapPoints={["40%", dimensions.height - top - 10]}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
        handleIndicatorStyle={handleIndicatorStyle}
        handleStyle={handleStyle}
        backgroundStyle={backgroundStyle}
        enableDismissOnClose
        detached
        animateOnMount={!reducedMotion}
      >
        <BackButtonOverride dismiss={dismissSheet} />
        <Text className="my-2 text-center text-xl font-medium">
          <Trans>Switch Accounts</Trans>
        </Text>
        <BottomSheetScrollView style={contentContainerStyle}>
          <SwitchAccounts
            active={agent?.session?.did}
            onSuccessfulSwitch={dismissSheet}
          />
        </BottomSheetScrollView>
      </BottomSheetModal>
      <StatusBar />
      <Stack.Screen
        options={{
          headerShown: false,
          animation: "none",
          gestureEnabled: false,
        }}
      />
      <Drawer
        open={open}
        onOpen={onOpen}
        onClose={onClose}
        renderDrawerContent={renderDrawerContent}
        drawerType="slide"
        drawerStyle={{
          width: Math.min(dimensions.width * 0.8, 400),
          backgroundColor: theme.colors.card,
        }}
        swipeEdgeWidth={dimensions.width}
        // @ts-expect-error
        swipeEnabled={segments.length === 3}
      >
        <Tabs
          sidebarAdaptable
          labeled={Platform.OS !== "ios"}
          tabBarStyle={
            Platform.OS === "android"
              ? { backgroundColor: theme.colors.card }
              : undefined
          }
          activeIndicatorColor={theme.colors.background}
          tabBarActiveTintColor={
            Platform.OS === "android"
              ? theme.dark
                ? colors.neutral[400]
                : colors.neutral[600]
              : undefined
          }
        >
          <Tabs.Screen
            name="(feeds)"
            options={{
              title: homepage === "feeds" ? _(msg`Feeds`) : _(msg`Skyline`),
              tabBarIcon:
                homepage === "feeds"
                  ? () =>
                      Platform.select({
                        ios: {
                          sfSymbol: "cloud",
                        },
                        android: require("../../../assets/tabs/cloudy.svg"),
                      })
                  : () =>
                      Platform.select({
                        ios: {
                          sfSymbol: "cloud",
                        },
                        android: require("../../../assets/tabs/cloud.svg"),
                      }),
            }}
          />
          <Tabs.Screen
            name="(search)"
            options={{
              title: _(msg`Search`),
              tabBarIcon: () =>
                Platform.select({
                  ios: {
                    sfSymbol: "magnifyingglass",
                  },
                  android: require("../../../assets/tabs/search.svg"),
                }),
            }}
          />
          <Tabs.Screen
            name="null"
            options={{
              title: _(msg`Post`),
              tabBarIcon: () =>
                Platform.select({
                  ios: {
                    sfSymbol: "square.and.pencil",
                  },
                  android: require("../../../assets/tabs/square-pen.svg"),
                }),
              preventsDefault: true,
              role: "search",
            }}
            listeners={{
              tabPress: (evt) => {
                if (agent?.hasSession) {
                  if (segments.at(-2) === "profile") {
                    const actor = pathname.split("/").pop()!;
                    try {
                      if (actor.startsWith("did:")) {
                        if (actor === agent.session?.did)
                          throw new Error("Cannot mention yourself");
                        void agent.getProfile({ actor }).then((profile) => {
                          if (!profile.success)
                            throw new Error("Failed to fetch profile");
                          router.push(
                            `/composer/?initialText=@${profile.data.handle}`,
                          );
                        });
                      } else {
                        if (actor === agent.session?.handle)
                          throw new Error("Cannot mention yourself");
                        router.push(`/composer/?initialText=@${actor}`);
                      }
                    } catch (err) {
                      console.error(err);
                      router.push("/composer");
                    }
                  } else {
                    router.push("/composer");
                  }
                }
              },
            }}
          />
          <Tabs.Screen
            name="(notifications)"
            options={{
              title: _(msg`Notifications`),
              tabBarBadge: notifications.data?.count
                ? notifications.data.count > 30
                  ? "30+"
                  : String(notifications.data.count)
                : undefined,
              tabBarIcon: () =>
                Platform.select({
                  ios: {
                    sfSymbol: "bell",
                  },
                  android: require("../../../assets/tabs/bell.svg"),
                }),
            }}
          />
          <Tabs.Screen
            name="(self)"
            options={{
              title: _(msg`Profile`),
              tabBarIcon: () =>
                Platform.select({
                  ios: {
                    sfSymbol: "person",
                  },
                  android: require("../../../assets/tabs/user.svg"),
                }),
            }}
            listeners={{
              tabLongPress: () => {
                haptics.selection();
                accountRef.current?.present();
              },
            }}
          />
        </Tabs>
      </Drawer>
    </DrawerProvider>
  );
}
