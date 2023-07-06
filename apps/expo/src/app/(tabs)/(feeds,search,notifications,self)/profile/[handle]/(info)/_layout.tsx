import { Stack, useLocalSearchParams } from "expo-router";
import { TopTabs } from "@bacons/expo-router-top-tabs";
import { useTheme } from "@react-navigation/native";

import { ComposeButton } from "../../../../../../components/compose-button";
import { QueryWithoutData } from "../../../../../../components/query-without-data";
import {
  useProfile,
  useProfileFeeds,
} from "../../../../../../components/screens/profile/hooks";
import { ProfileInfo } from "../../../../../../components/screens/profile/profile-info";

export default function ProfileLayout() {
  const { handle } = useLocalSearchParams() as { handle: string };
  const profile = useProfile(handle);
  const feeds = useProfileFeeds(handle);
  const theme = useTheme();

  const numberOfFeeds = feeds.data?.pages?.[0]?.feeds?.length ?? 0;

  if (profile.data) {
    return (
      <>
        <TopTabs
          screenOptions={{
            tabBarScrollEnabled: true,
            tabBarIndicatorContainerStyle: {
              marginHorizontal: 16,
            },
            tabBarStyle: {
              backgroundColor: theme.colors.card,
              borderBottomColor: theme.colors.border,
              borderBottomWidth: 1,
              paddingHorizontal: 16,
            },
            tabBarItemStyle: {
              width: "auto",
            },
            tabBarIndicatorStyle: {
              backgroundColor: theme.colors.primary,
              bottom: -1,
              height: 2.5,
            },
            tabBarLabelStyle: {
              textTransform: "none",
            },
          }}
          options={{
            lazy: true,
          }}
        >
          <TopTabs.Header>
            <ProfileInfo profile={profile.data} />
          </TopTabs.Header>
          <TopTabs.Screen
            name="posts"
            options={{
              title: "Posts",
            }}
          />
          <TopTabs.Screen
            name="replies"
            options={{
              title: "Posts & Replies",
            }}
          />
          <TopTabs.Screen
            name="media"
            options={{
              title: "Media",
            }}
          />
          <TopTabs.Screen
            name="likes"
            options={{
              title: "Likes",
            }}
          />
          <TopTabs.Screen
            name="feeds"
            options={{
              title: "Feeds",
              tabBarShowLabel: numberOfFeeds !== 0,
            }}
          />
        </TopTabs>
        <ComposeButton />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: "",
        }}
      />
      <QueryWithoutData query={profile} />
    </>
  );
}
