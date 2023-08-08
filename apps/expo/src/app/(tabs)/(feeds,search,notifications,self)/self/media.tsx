import { ProfilePosts } from "../../../../components/screens/profile/profile-posts";
import { useAgent } from "../../../../lib/agent";

export default function MediaTab() {
  const agent = useAgent();

  if (!agent.session) return null;

  return <ProfilePosts mode="media" handle={agent.session.handle} />;
}
