import { ComposeButton } from "../../../components/compose-button";
import { ProfileView } from "../../../components/profile-view";
import { useAuthedAgent } from "../../../lib/agent";

export default function ProfilePage() {
  const agent = useAuthedAgent();

  return (
    <>
      <ProfileView handle={agent.session.handle} header={false} />
      <ComposeButton />
    </>
  );
}
