import { ComposeButton } from "../../../components/compose-button";
import { ProfileScreen } from "../../../components/screens/profile-screen";
import { useAuthedAgent } from "../../../lib/agent";

export default function ProfilePage() {
  const agent = useAuthedAgent();

  return (
    <>
      <ProfileScreen handle={agent.session.handle} header={false} />
      <ComposeButton />
    </>
  );
}
