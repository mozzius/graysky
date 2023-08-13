import { useLocalSearchParams } from "expo-router";

import { ChangePasswordFlow } from "../../components/change-password-flow";

export default function ResetPassword() {
  const { email } = useLocalSearchParams<{ email: string }>();

  return <ChangePasswordFlow defaultEmail={email} />;
}
