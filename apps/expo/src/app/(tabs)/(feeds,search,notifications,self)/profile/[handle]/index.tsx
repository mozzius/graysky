import { useLocalSearchParams } from "expo-router";

import { ProfileScreen } from "../../../../../components/screens/profile-screen";

export default function ProfilePage() {
  const { handle } = useLocalSearchParams() as { handle: string };

  return <ProfileScreen handle={handle} />;
}
