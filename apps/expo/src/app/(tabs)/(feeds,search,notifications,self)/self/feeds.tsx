import { useAuthedAgent } from "../../../../lib/agent";

export default function FeedsTab() {
  const agent = useAuthedAgent();

  if (!agent.session) return null;

  return <ProfileFeed mode="feeds" handle={agent.session.handle} />;
}
