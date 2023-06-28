import { useAuthedAgent } from "../../../../lib/agent";

export default function MediaTab() {
  const agent = useAuthedAgent();

  if (!agent.session) return null;

  return <ProfileFeed mode="media" handle={agent.session.handle} />;
}
