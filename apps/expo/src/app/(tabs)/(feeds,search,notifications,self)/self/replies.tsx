import { ProfilePosts } from "../../../../components/screens/profile/profile-posts";
import { useAgent } from "../../../../lib/agent";

export default function PostsTab() {
  const agent = useAgent();

  if (!agent.session) return null;

  return <ProfilePosts mode="replies" handle={agent.session.handle} />;
}
