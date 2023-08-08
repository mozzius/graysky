import { ProfilePosts } from "../../../../components/screens/profile/profile-posts";
import { useAgent } from "../../../../lib/agent";

export default function LikesTab() {
  const agent = useAgent();

  if (!agent.session) return null;

  return <ProfilePosts mode="likes" handle={agent.session.handle} />;
}
