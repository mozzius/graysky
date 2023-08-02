import { TopTabs } from "@bacons/expo-router-top-tabs";
import { useTheme } from "@react-navigation/native";

import { createTopTabsScreenOptions } from "../../../../lib/utils/top-tabs";

export default function NotificationsLayout() {
  const theme = useTheme();

  return (
    <TopTabs
      screenOptions={createTopTabsScreenOptions(theme)}
      options={{ lazy: true }}
    >
      <TopTabs.Header>
        <></>
      </TopTabs.Header>
      <TopTabs.Screen
        name="index"
        options={{
          title: "All",
        }}
      />
      <TopTabs.Screen
        name="mentions"
        options={{
          title: "Mentions",
        }}
      />
    </TopTabs>
  );
}
