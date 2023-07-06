import { ProfilePosts } from "../../../../components/screens/profile/profile-posts";
import { useAuthedAgent } from "../../../../lib/agent";

export default function MediaTab() {
  const agent = useAuthedAgent();

  if (!agent.session) return null;

  return <ProfilePosts mode="media" handle={agent.session.handle} />;
}
