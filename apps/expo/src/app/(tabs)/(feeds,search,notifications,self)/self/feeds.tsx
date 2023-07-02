import { ProfileFeeds } from "../../../../components/screens/profile/profile-feeds";
import { useAuthedAgent } from "../../../../lib/agent";

export default function FeedsTab() {
  const agent = useAuthedAgent();

  if (!agent.session) return null;

  return <ProfileFeeds handle={agent.session.handle} />;
}
