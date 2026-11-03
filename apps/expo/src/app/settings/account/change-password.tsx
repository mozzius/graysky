import { ChangePasswordFlow } from "~/components/screens/change-password-flow";
import { useSession } from "~/lib/agent";

export default function ChangePassword() {
  const session = useSession();
  return <ChangePasswordFlow defaultEmail={session?.email} />;
}
