import { ChangePasswordFlow } from "~/components/screens/change-password-flow";
import { useAgent } from "~/lib/agent";

export default function ChangePassword() {
  const agent = useAgent();
  return <ChangePasswordFlow defaultEmail={agent?.session?.email} />;
}
