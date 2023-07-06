import { ProfilePosts } from "../../../../components/screens/profile/profile-posts";
import { useAuthedAgent } from "../../../../lib/agent";

export default function PostsTab() {
  const agent = useAuthedAgent();

  if (!agent.session) return null;

  return <ProfilePosts mode="posts" handle={agent.session.handle} />;
}
