import { useLocalSearchParams } from "expo-router";

export default function ProfilePage() {
  const { handle } = useLocalSearchParams() as { handle: string };

  return <ProfileScreen handle={handle} />;
}
