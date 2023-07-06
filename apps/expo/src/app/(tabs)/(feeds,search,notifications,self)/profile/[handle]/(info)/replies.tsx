import { useGlobalSearchParams } from "expo-router";

import { ProfilePosts } from "../../../../../../components/screens/profile/profile-posts";

export default function PostsTab() {
  const { handle } = useGlobalSearchParams() as { handle: string };

  return <ProfilePosts mode="replies" handle={handle} />;
}
