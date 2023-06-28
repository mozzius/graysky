import { useAuthedAgent } from "../../../../lib/agent";

export default function PostsTab() {
  const agent = useAuthedAgent();

  if (!agent.session) return null;

  return <ProfileFeed mode="replies" handle={agent.session.handle} />;
}
