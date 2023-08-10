import { ProfileTabView } from "../../../components/screens/profile/profile-tab-view";
import { useAgent } from "../../../lib/agent";

export default function ProfileRedirect() {
  const agent = useAgent();
  const handle = agent.session?.handle;

  if (!handle) return null;

  return <ProfileTabView handle={handle} />;
}
