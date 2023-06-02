import { useMemo } from "react";
import { Text, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";

import { Avatar } from "../../../../components/avatar";
import { ComposeButton } from "../../../../components/compose-button";
import { useDrawer } from "../../../../components/drawer-content";
import { useSavedFeeds } from "../../../../lib/hooks";

const FeedsPage = () => {
  const savedFeeds = useSavedFeeds({ pinned: true });

  const _routes = useMemo(() => {
    const routes = [{ key: "following", title: "Following" }];
    if (savedFeeds.data) {
      routes.push(
        ...savedFeeds.data.feeds.map((feed) => ({
          key: feed.uri,
          title: feed.displayName,
        })),
      );
    }
    return routes;
  }, [savedFeeds.data]);

  return null;
};

export default function Page() {
  const openDrawer = useDrawer();
  return (
    <>
      <Stack.Screen
        options={{
          title: "Feeds",
          headerLargeTitle: true,
          headerLeft: () => (
            <TouchableOpacity onPress={openDrawer}>
              <Avatar size="small" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity>
              <Text className="text-base text-link">Edit</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <FeedsPage />
      <ComposeButton />
    </>
  );
}
