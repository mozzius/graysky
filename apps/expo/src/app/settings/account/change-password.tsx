import { ChangePasswordFlow } from "../../../components/change-password-flow";
import { useAgent } from "../../../lib/agent";

export default function ChangePassword() {
  const agent = useAgent();
  return <ChangePasswordFlow defaultEmail={agent?.session?.email} />;
}
