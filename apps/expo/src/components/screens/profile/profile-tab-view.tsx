import { useCallback } from "react";
import { Platform } from "react-native";
import { MaterialTabBar, Tabs } from "react-native-collapsible-tab-view";
import { Stack } from "expo-router";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";

import { StatusBar } from "~/components/status-bar";
import { createTopTabsScreenOptions } from "~/lib/utils/top-tabs";
import { QueryWithoutData } from "../../query-without-data";
import {
  useDefaultHeaderHeight,
  useProfile,
  useProfileFeeds,
  useProfileLists,
} from "./hooks";
import { ProfileFeeds } from "./profile-feeds";
import { ProfileInfo } from "./profile-info";
import { ProfileLists } from "./profile-lists";
import { ProfilePosts } from "./profile-posts";

interface Props {
  did: string;
  initial?: string;
  backButton?: boolean;
}

export const ProfileTabView = ({
  did,
  initial = "posts",
  backButton,
}: Props) => {
  const profile = useProfile(did);
  const feeds = useProfileFeeds(did);
  const lists = useProfileLists(did);
  const theme = useTheme();
  const headerHeight = useDefaultHeaderHeight();
  const { _ } = useLingui();

  const numberOfFeeds = feeds.data?.pages?.[0]?.feeds?.length ?? 0;
  const numberOfLists = lists.data?.pages?.[0]?.lists?.length ?? 0;

  const renderProfileInfo = useCallback(() => {
    if (profile.data) {
      return <ProfileInfo profile={profile.data} backButton={backButton} />;
    }
    return null;
  }, [profile.data, backButton]);

  if (profile.data) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: false,
            title: profile.data.displayName ?? `@${profile.data.handle}`,
          }}
        />
        <StatusBar style="light" />
        <Tabs.Container
          minHeaderHeight={headerHeight}
          initialTabName={initial}
          headerContainerStyle={{ shadowOpacity: 0, elevation: 0 }}
          renderTabBar={(props) => (
            <MaterialTabBar
              {...props}
              {...createTopTabsScreenOptions(theme)}
              scrollEnabled
            />
          )}
          renderHeader={renderProfileInfo}
          allowHeaderOverscroll={Platform.OS === "ios"}
          lazy
        >
          <Tabs.Tab name="posts" label={_(msg`Posts`)}>
            <ProfilePosts mode="posts" did={did} />
          </Tabs.Tab>
          <Tabs.Tab name="replies" label={_(msg`Replies`)}>
            <ProfilePosts mode="replies" did={did} />
          </Tabs.Tab>
          <Tabs.Tab name="media" label={_(msg`Media`)}>
            <ProfilePosts mode="media" did={did} />
          </Tabs.Tab>
          <Tabs.Tab name="likes" label={_(msg`Likes`)}>
            <ProfilePosts mode="likes" did={did} />
          </Tabs.Tab>
          {numberOfFeeds === 0 ? null : (
            <Tabs.Tab name="feeds" label={_(msg`Feeds`)}>
              <ProfileFeeds did={did} />
            </Tabs.Tab>
          )}
          {numberOfLists === 0 ? null : (
            <Tabs.Tab name="lists" label={_(msg`Lists`)}>
              <ProfileLists did={did} />
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
          headerShown: false,
        }}
      />
      <StatusBar style="light" />
      <QueryWithoutData query={profile} />
    </>
  );
};
