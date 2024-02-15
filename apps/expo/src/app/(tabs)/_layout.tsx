import { useCallback, useRef, useState } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { Drawer } from "react-native-drawer-layout";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";
import { Stack, Tabs, usePathname, useRouter, useSegments } from "expo-router";
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

  useNotifications();

  const notifications = useQuery({
    queryKey: ["notifications", "unread"],
    queryFn: async () => {
      if (!agent?.hasSession) return null;
      const unreadCount = await agent.countUnreadNotifications();
      if (!unreadCount.success)
        throw new Error("通知の取得に失敗しました");
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
          Switch Accounts
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
              title: homepage === "feeds" ? "フィード" : "Skyline",
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
              title: "検索",
              tabBarIcon({ color, size }) {
                return <SearchIcon color={color} size={size} />;
              },
            }}
          />
          <Tabs.Screen
            name="null"
            options={{
              title: "投稿",
              tabBarAccessibilityLabel: "新規投稿を作成",
              tabBarIcon({ color, size }) {
                return <PenBox color={color} size={size} />;
              },
            }}
            listeners={{
              tabPress: (evt) => {
                evt.preventDefault();
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
              title: "通知",
              tabBarAccessibilityLabel: `Notifications${
                notifications.data?.count ? ", new items" : ""
              }`,
              tabBarBadge: notifications.data?.count
                ? notifications.data.count > 30
                  ? "30+"
                  : notifications.data.count
                : undefined,
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
              title: "プロフィール",
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
