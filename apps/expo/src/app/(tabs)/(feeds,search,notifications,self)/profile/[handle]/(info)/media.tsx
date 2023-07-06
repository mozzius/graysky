import { useGlobalSearchParams } from "expo-router";

import { ProfilePosts } from "../../../../../../components/screens/profile/profile-posts";

export default function MediaTab() {
  const { handle } = useGlobalSearchParams() as { handle: string };

  return <ProfilePosts mode="media" handle={handle} />;
}
