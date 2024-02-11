import { ProfileTabView } from "~/components/screens/profile/profile-tab-view";
import { useAgent } from "~/lib/agent";

export default function SelfProfile() {
  const agent = useAgent();
  const did = agent.session?.did;

  if (!did) return null;

  return <ProfileTabView did={did} />;
}
