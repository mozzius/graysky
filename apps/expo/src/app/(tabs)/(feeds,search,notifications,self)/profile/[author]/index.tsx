import { useLocalSearchParams } from "expo-router";

import { ProfileTabView } from "~/components/screens/profile/profile-tab-view";

export default function ProfilePage() {
  const { author, tab } = useLocalSearchParams<{
    author: string;
    tab: string;
  }>();

  if (!author) return null;

  return <ProfileTabView handle={author} initial={tab} backButton />;
}
