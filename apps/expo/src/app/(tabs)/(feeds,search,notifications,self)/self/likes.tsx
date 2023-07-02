import { ProfilePosts } from "../../../../components/screens/profile/profile-posts";
import { useAuthedAgent } from "../../../../lib/agent";

export default function LikesTab() {
  const agent = useAuthedAgent();

  if (!agent.session) return null;

  return <ProfilePosts mode="likes" handle={agent.session.handle} />;
}
