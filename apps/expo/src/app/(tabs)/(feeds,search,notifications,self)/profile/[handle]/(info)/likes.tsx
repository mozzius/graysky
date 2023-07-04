import { useLocalSearchParams } from "expo-router";

import { ProfilePosts } from "../../../../../../components/screens/profile/profile-posts";

export default function LikesTab() {
  const { handle } = useLocalSearchParams() as { handle: string };

  return <ProfilePosts mode="likes" handle={handle} />;
}
