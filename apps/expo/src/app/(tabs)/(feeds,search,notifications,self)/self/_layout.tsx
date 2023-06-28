import { TopTabs } from "@bacons/expo-router-top-tabs";

import { ProfileInfo } from "../../../../components/profile-info";
import { QueryWithoutData } from "../../../../components/query-without-data";
import {
  useProfile,
  useProfileFeeds,
} from "../../../../components/screens/profile/hooks";

export default function ProfileLayout() {
  const profile = useProfile();
  const feeds = useProfileFeeds();

  const numberOfFeeds = feeds.data?.pages?.[0]?.feeds?.length ?? 0;

  if (profile.data) {
    return (
      <TopTabs>
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
