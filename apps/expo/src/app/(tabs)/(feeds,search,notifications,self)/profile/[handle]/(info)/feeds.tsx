import { useGlobalSearchParams } from "expo-router";

import { ProfileFeeds } from "../../../../../../components/screens/profile/profile-feeds";

export default function FeedsTab() {
  const { handle } = useGlobalSearchParams() as { handle: string };

  return <ProfileFeeds handle={handle} />;
}
