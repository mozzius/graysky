import { useCallback, useRef, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { useMMKVObject } from "react-native-mmkv";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { Stack, Tabs, useRouter, useSegments } from "expo-router";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import {
  BellIcon,
  CloudIcon,
  CloudyIcon,
  PenBox,
  SearchIcon,
  UserIcon,
} from "lucide-react-native";

import { BackButtonOverride } from "~/components/back-button-override";
import { DrawerProvider } from "~/components/drawer/context";
import { DrawerContent } from "~/components/drawer/drawer-content";
import { StatusBar } from "~/components/status-bar";
import {
  SwitchAccounts,
  type SavedSession,
} from "~/components/switch-accounts";
import { Text } from "~/components/themed/text";
import { useOptionalAgent } from "~/lib/agent";
import { useBottomSheetStyles } from "~/lib/bottom-sheet";
import { useNotifications } from "~/lib/hooks/notifications";
import { useAppPreferences, useHaptics } from "~/lib/hooks/preferences";
import { store } from "~/lib/storage";
import { useRefreshOnFocus } from "~/lib/utils/query";

export default function AppLayout() {
  // agent might not be available yet
  const agent = useOptionalAgent();
  const [open, setOpen] = useState(false);

  useNotifications();

  const notifications = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      if (!agent?.hasSession) return null;
      const unreadCount = await agent.countUnreadNotifications();
      if (!unreadCount.success)
        throw new Error("Failed to fetch notifications");
      await Notifications.setBadgeCountAsync(unreadCount.data.count);
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
  const router = useRouter();

  const [{ homepage }] = useAppPreferences();

  const accountRef = useRef<BottomSheetModal>(null);
  const [sessions] = useMMKVObject<SavedSession[]>("sessions", store);
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
          Switch Accounts
        </Text>
        <BottomSheetScrollView style={contentContainerStyle}>
          <SwitchAccounts
            sessions={sessions ?? []}
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
        statusBarAnimation="slide"
        drawerStyle={{
          width: Math.min(dimensions.width * 0.8, 400),
          backgroundColor: theme.colors.card,
        }}
        swipeEdgeWidth={dimensions.width}
        swipeEnabled={segments.length === 3}
      >
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: Platform.select({ android: false, ios: true }),
          }}
        >
          <Tabs.Screen
            name="(feeds)"
            options={{
              title: homepage === "feeds" ? "Feeds" : "Skyline",
              tabBarIcon({ color, size }) {
                return homepage === "feeds" ? (
                  <CloudyIcon color={color} size={size} />
                ) : (
                  <CloudIcon color={color} size={size} />
                );
              },
            }}
          />
          <Tabs.Screen
            name="(search)"
            options={{
              title: "Search",
              tabBarIcon({ color, size }) {
                return <SearchIcon color={color} size={size} />;
              },
            }}
          />
          <Tabs.Screen
            name="null"
            options={{
              title: "Post",
              tabBarAccessibilityLabel: "Create a new post",
              tabBarIcon({ color, size }) {
                return <PenBox color={color} size={size} />;
              },
            }}
            listeners={{
              tabPress: (evt) => {
                evt.preventDefault();
                if (agent?.hasSession) {
                  router.push("/composer");
                }
              },
            }}
          />
          <Tabs.Screen
            name="(notifications)"
            options={{
              title: "Notifications",
              tabBarAccessibilityLabel: `Notifications${
                notifications.data?.count || undefined ? ", new items" : ""
              }`,
              tabBarBadge: notifications.data?.count || undefined,
              tabBarBadgeStyle: {
                fontSize: 12,
                backgroundColor: theme.colors.primary,
              },
              tabBarIcon({ color, size }) {
                return <BellIcon color={color} size={size} />;
              },
            }}
          />
          <Tabs.Screen
            name="(self)"
            options={{
              title: "Profile",
              headerShown: false,
              tabBarIcon({ color, size }) {
                return <UserIcon color={color} size={size} />;
              },
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
