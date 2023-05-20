import { ComposerProvider } from "../../../components/composer";
import { ProfileView } from "../../../components/profile-view";
import { useAuthedAgent } from "../../../lib/agent";

export default function ProfilePage() {
  const agent = useAuthedAgent();

  return (
    <ComposerProvider>
      <ProfileView handle={agent.session.handle} header={false} composer />
    </ComposerProvider>
  );
}
