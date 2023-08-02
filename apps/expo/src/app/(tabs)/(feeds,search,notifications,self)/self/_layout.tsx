import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TopTabs } from "@bacons/expo-router-top-tabs";
import { useTheme } from "@react-navigation/native";

import { QueryWithoutData } from "../../../../components/query-without-data";
import {
  useProfile,
  useProfileFeeds,
} from "../../../../components/screens/profile/hooks";
import { ProfileInfo } from "../../../../components/screens/profile/profile-info";
import { createTopTabsScreenOptions } from "../../../../lib/utils/top-tabs";

export default function ProfileLayout() {
  const profile = useProfile();
  const feeds = useProfileFeeds();
  const theme = useTheme();
  const { top } = useSafeAreaInsets();

  const numberOfFeeds = feeds.data?.pages?.[0]?.feeds?.length ?? 0;

  if (profile.data) {
    return (
      <>
        <View
          style={{ backgroundColor: theme.colors.card, height: top }}
          className="w-full"
        />
        <TopTabs screenOptions={createTopTabsScreenOptions(theme)}>
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
          <TopTabs.Screen
            name="feeds"
            options={{
              title: "Feeds",
              tabBarShowLabel: numberOfFeeds !== 0,
            }}
          />
        </TopTabs>
      </>
    );
  }

  return <QueryWithoutData query={profile} />;
}
