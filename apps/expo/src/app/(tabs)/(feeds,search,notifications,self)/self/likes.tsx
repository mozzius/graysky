import { useAuthedAgent } from "../../../../lib/agent";

export default function LikesTab() {
  const agent = useAuthedAgent();

  if (!agent.session) return null;

  return <ProfileFeed mode="likes" handle={agent.session.handle} />;
}
