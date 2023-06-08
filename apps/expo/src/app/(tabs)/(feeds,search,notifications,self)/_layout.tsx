import { Platform, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";

import { Avatar } from "../../../components/avatar";
import { ComposerProvider } from "../../../components/composer";
import { useDrawer } from "../../../components/drawer-content";

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

  const headerLeft = () => (
    <TouchableOpacity onPress={() => openDrawer()} className="mr-3">
      <Avatar size="small" />
    </TouchableOpacity>
  );

  switch (segment) {
    case "(feeds)":
      return (
        <ComposerProvider>
          <Stack {...stackOptions}>
            <Stack.Screen
              name="feeds/index"
              options={{
                title: "Feeds",
                headerLargeTitle: true,
                headerLeft,
              }}
            />
            <Stack.Screen
              name="feeds/discover"
              options={{
                title: "Discover Feeds",
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
        </ComposerProvider>
      );
    case "(search)":
      return (
        <ComposerProvider>
          <Stack {...stackOptions}>
            <Stack.Screen
              name="search"
              options={{
                title: "Search",
                headerLeft: Platform.select({
                  ios: headerLeft,
                }),
                headerSearchBarOptions: {},
              }}
            />
          </Stack>
        </ComposerProvider>
      );
    case "(notifications)":
      return (
        <ComposerProvider>
          <Stack {...stackOptions}>
            <Stack.Screen
              name="notifications"
              options={{
                title: "Notifications",
                headerLeft,
              }}
            />
          </Stack>
        </ComposerProvider>
      );
    case "(self)":
      return (
        <ComposerProvider>
          <Stack {...stackOptions}>
            <Stack.Screen
              name="self"
              options={{
                headerShown: false,
              }}
            />
          </Stack>
        </ComposerProvider>
      );
  }
}
