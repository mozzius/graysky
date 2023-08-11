import { useCallback } from "react";
import { MaterialTabBar, Tabs } from "react-native-collapsible-tab-view";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@react-navigation/native";

import { createTopTabsScreenOptions } from "../../../lib/utils/top-tabs";
import { QueryWithoutData } from "../../query-without-data";
import { useDefaultHeaderHeight, useProfile, useProfileFeeds } from "./hooks";
import { ProfileFeeds } from "./profile-feeds";
import { ProfileInfo } from "./profile-info";
import { ProfilePosts } from "./profile-posts";

interface Props {
  handle: string;
  initial?: string;
  backButton?: boolean;
}

export const ProfileTabView = ({
  handle,
  initial = "posts",
  backButton,
}: Props) => {
  const profile = useProfile(handle);
  const feeds = useProfileFeeds(handle);
  const theme = useTheme();
  const headerHeight = useDefaultHeaderHeight();

  const numberOfFeeds = feeds.data?.pages?.[0]?.feeds?.length ?? 0;

  const renderProfileInfo = useCallback(() => {
    if (profile.data) {
      return <ProfileInfo profile={profile.data} backButton={backButton} />;
    }
    return null;
  }, [profile.data, backButton]);

  if (profile.data) {
    return (
      <>
        <StatusBar style="light" />
        <Stack.Screen
          options={{
            headerShown: false,
            title: profile.data.displayName ?? `@${profile.data.handle}`,
          }}
        />
        <Tabs.Container
          minHeaderHeight={headerHeight}
          initialTabName={initial}
          renderTabBar={(props) => (
            <MaterialTabBar
              {...props}
              {...createTopTabsScreenOptions(theme)}
              activeColor={theme.colors.text}
              inactiveColor={theme.colors.text}
            />
          )}
          renderHeader={renderProfileInfo}
          // lazy
        >
          <Tabs.Tab name="posts" label="Posts">
            <ProfilePosts mode="posts" handle={handle} />
          </Tabs.Tab>
          <Tabs.Tab name="replies" label="Replies">
            <ProfilePosts mode="replies" handle={handle} />
          </Tabs.Tab>
          <Tabs.Tab name="media" label="Media">
            <ProfilePosts mode="media" handle={handle} />
          </Tabs.Tab>
          <Tabs.Tab name="likes" label="Likes">
            <ProfilePosts mode="likes" handle={handle} />
          </Tabs.Tab>
          {numberOfFeeds === 0 ? null : (
            <Tabs.Tab name="feeds" label="Feeds">
              <ProfileFeeds handle={handle} />
            </Tabs.Tab>
          )}
        </Tabs.Container>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
          headerTransparent: true,
        }}
      />
      <QueryWithoutData query={profile} />
    </>
  );
};
