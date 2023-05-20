import { ProfileView } from "../../../../../components/profile-view";
import { useLocalSearchParams } from "expo-router";

export default function ProfilePage() {
  const { handle } = useLocalSearchParams() as { handle: string };

  return <ProfileView handle={handle} />;
}
