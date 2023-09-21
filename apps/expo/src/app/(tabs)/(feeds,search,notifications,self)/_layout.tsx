import {
  ActivityIndicator,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";

import { Avatar } from "~/components/avatar";
import { useDrawer } from "~/components/drawer-content";
import { useOptionalAgent } from "~/lib/agent";
import { useAppPreferences } from "~/lib/hooks/preferences";

const stackOptions = {
  screenOptions: {
    fullScreenGestureEnabled: true,
  },
};

export default function SubStack({
  segment,
}: {
  segment: "(feeds)" | "(search)" | "(notifications)" | "(self)";
}) {
  const openDrawer = useDrawer();
  const router = useRouter();
  const theme = useTheme();
  // agent might not be available yet
  const agent = useOptionalAgent();

  const [{ homepage }] = useAppPreferences();

  const headerLeft = () => (
    <TouchableOpacity onPress={() => openDrawer()} className="mr-3">
      <Avatar size="small" />
    </TouchableOpacity>
  );

  if (!agent?.hasSession) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-base">Connecting...</Text>
      </View>
    );
  }

  switch (segment) {
    case "(feeds)":
      return (
        <Stack {...stackOptions}>
          <Stack.Screen
            name="feeds/index"
            options={
              homepage === "feeds"
                ? {
                    title: "Feeds",
                    headerLargeTitle: true,
                    headerLeft,
                  }
                : {
                    title: "Skyline",
                    headerLeft,
                  }
            }
          />
          <Stack.Screen
            name="feeds/discover"
            options={{
              title: "Discover Feeds",
              presentation: "modal",
              headerRight: Platform.select({
                ios: () => (
                  <TouchableOpacity
                    onPress={() => {
                      router.canGoBack()
                        ? router.push("../")
                        : router.push("/feeds");
                    }}
                  >
                    <Text
                      style={{ color: theme.colors.primary }}
                      className="text-lg font-medium"
                    >
                      Done
                    </Text>
                  </TouchableOpacity>
                ),
              }),
              headerLargeTitle: true,
              headerLargeTitleShadowVisible: false,
              headerLargeStyle: {
                backgroundColor: theme.colors.background,
              },
              headerSearchBarOptions: {},
            }}
          />
          <Stack.Screen
            name="feeds/following"
            options={{
              title: "Following",
            }}
          />
        </Stack>
      );
    case "(search)":
      return (
        <Stack {...stackOptions}>
          <Stack.Screen
            name="search/index"
            options={{
              title: "Search",
              headerLeft: Platform.select({
                ios: headerLeft,
              }),
              headerLargeTitle: true,
            }}
          />
          <Stack.Screen
            name="search/posts"
            options={{
              title: "Search Posts",
            }}
          />
          <Stack.Screen
            name="search/feeds"
            options={{
              title: "Search Feeds",
            }}
          />
          <Stack.Screen
            name="search/people"
            options={{
              title: "Search People",
            }}
          />
        </Stack>
      );
    case "(notifications)":
      return (
        <Stack {...stackOptions}>
          <Stack.Screen
            name="notifications"
            options={{
              title: "Notifications",
              headerLargeTitle: true,
              headerLeft,
            }}
          />
        </Stack>
      );
    case "(self)":
      return (
        <Stack {...stackOptions}>
          <Stack.Screen
            name="self"
            options={{
              headerShown: false,
              headerBackTitle: "Profile",
            }}
          />
        </Stack>
      );
  }
}
