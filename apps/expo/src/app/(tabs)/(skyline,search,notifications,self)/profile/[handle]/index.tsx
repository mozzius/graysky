import { useLocalSearchParams } from "expo-router";

import { ProfileView } from "../../../../../components/profile-view";

export default function ProfilePage() {
  const { handle } = useLocalSearchParams() as { handle: string };

  return <ProfileView handle={handle} />;
}
