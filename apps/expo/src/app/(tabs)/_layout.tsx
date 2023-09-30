import { useCallback, useRef, useState } from "react";
import { Dimensions, Platform } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { useMMKVObject } from "react-native-mmkv";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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
  UserCircleIcon,
} from "lucide-react-native";

import { BackButtonOverride } from "~/components/back-button-override";
import { DrawerProvider } from "~/components/drawer/context";
import { DrawerContent } from "~/components/drawer/drawer-content";
import { StatusBar } from "~/components/status-bar";
import {
  SwitchAccounts,
  type SavedSession,
} from "~/components/switch-accounts";
import { Text } from "~/components/text";
import { useOptionalAgent } from "~/lib/agent";
import { useBottomSheetStyles } from "~/lib/bottom-sheet";
import { useAppPreferences, useHaptics } from "~/lib/hooks/preferences";
import { store } from "~/lib/storage";
import { useRefreshOnFocus } from "~/lib/utils/query";

export default function AppLayout() {
  // agent might not be available yet
  const agent = useOptionalAgent();
  const [open, setOpen] = useState(false);

  const notifications = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      if (!agent?.hasSession) return null;
      const unreadCount = await agent.countUnreadNotifications();
      if (!unreadCount.success)
        throw new Error("Failed to fetch notifications");
      return unreadCount.data;
    },
    // refetch every 15 seconds
    refetchInterval: 1000 * 15,
  });

  useRefreshOnFocus(notifications.refetch);

  const renderDrawerContent = useCallback(() => <DrawerContent />, []);

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

  const dismissSheet = useCallback(() => accountRef.current?.dismiss(), []);

  return (
    <DrawerProvider value={openDrawer}>
      <BottomSheetModal
        ref={accountRef}
        enablePanDownToClose
        snapPoints={["40%", Dimensions.get("window").height - top - 10]}
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
          width: Math.min(Dimensions.get("window").width * 0.8, 400),
          backgroundColor: theme.colors.card,
        }}
        swipeEdgeWidth={Dimensions.get("window").width}
        swipeEnabled={Platform.OS === "ios" ? segments.length === 3 : true}
      >
        <Tabs
          screenOptions={{ headerShown: false }}
          screenListeners={{
            tabPress: (evt) => {
              if (evt.target?.startsWith("null")) {
                evt.preventDefault();
                if (agent?.hasSession) {
                  router.push("/composer");
                }
              }
            },
            tabLongPress: (evt) => {
              if (evt.target?.startsWith("(self)")) {
                haptics.selection();
                accountRef.current?.present();
              }
            },
          }}
        >
          <Tabs.Screen
            name="(feeds)"
            options={{
              title: homepage === "feeds" ? "Feeds" : "Skyline",
              tabBarIcon({ color }) {
                return homepage === "feeds" ? (
                  <CloudyIcon color={color} />
                ) : (
                  <CloudIcon color={color} />
                );
              },
            }}
          />
          <Tabs.Screen
            name="(search)"
            options={{
              title: "Search",
              tabBarIcon({ color }) {
                return <SearchIcon color={color} />;
              },
            }}
          />
          <Tabs.Screen
            name="null"
            options={{
              title: "Post",
              tabBarIcon({ color }) {
                return <PenBox color={color} />;
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
              tabBarIcon({ color }) {
                return <BellIcon color={color} />;
              },
            }}
          />
          <Tabs.Screen
            name="(self)"
            options={{
              title: "Profile",
              headerShown: false,
              tabBarIcon({ color }) {
                return <UserCircleIcon color={color} />;
              },
            }}
          />
        </Tabs>
      </Drawer>
    </DrawerProvider>
  );
}
