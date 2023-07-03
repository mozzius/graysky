import { TopTabs } from "@bacons/expo-router-top-tabs";
import { useTheme } from "@react-navigation/native";

import { QueryWithoutData } from "../../../../components/query-without-data";
import {
  useProfile,
  useProfileFeeds,
} from "../../../../components/screens/profile/hooks";
import { ProfileInfo } from "../../../../components/screens/profile/profile-info";

export default function ProfileLayout() {
  const profile = useProfile();
  const feeds = useProfileFeeds();
  const theme = useTheme();

  const numberOfFeeds = feeds.data?.pages?.[0]?.feeds?.length ?? 0;

  if (profile.data) {
    return (
      <TopTabs
        screenOptions={{
          tabBarScrollEnabled: true,
        }}
        options={{
          lazy: true,
          pagerStyle: {
            borderBottomColor: theme.colors.border,
            backgroundColor: theme.colors.card,
          },
        }}
      >
        <TopTabs.Header>
          <ProfileInfo profile={profile.data} />
        </TopTabs.Header>
        <TopTabs.Screen
          name="index"
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
        {numberOfFeeds > 0 && (
          <TopTabs.Screen
            name="feeds"
            options={{
              title: "Feeds",
            }}
          />
        )}
      </TopTabs>
    );
  }

  return <QueryWithoutData query={profile} />;
}
