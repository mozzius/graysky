import { useLocalSearchParams } from "expo-router";

import { ProfileFeeds } from "../../../../../../components/screens/profile/profile-feeds";

export default function FeedsTab() {
  const { handle } = useLocalSearchParams() as { handle: string };

  return <ProfileFeeds handle={handle} />;
}
