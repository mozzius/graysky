import { useLocalSearchParams } from "expo-router";

import { ProfileTabView } from "../../../../../components/screens/profile/profile-tab-view";

export default function ProfileRedirect() {
  const { handle, tab } = useLocalSearchParams<{
    handle: string;
    tab: string;
  }>();

  if (!handle) return null;

  return <ProfileTabView handle={handle} initial={tab} backButton />;
}
