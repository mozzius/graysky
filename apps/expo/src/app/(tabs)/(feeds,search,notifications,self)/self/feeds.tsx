import { ProfileFeeds } from "../../../../components/screens/profile/profile-feeds";
import { useAgent } from "../../../../lib/agent";

export default function FeedsTab() {
  const agent = useAgent();

  if (!agent.session) return null;

  return <ProfileFeeds handle={agent.session.handle} />;
}
