import { Text } from "react-native";

import { useAgent } from "../../../lib/agent";

export default function ProfilePage() {
  const agent = useAgent();
  return <Text>{agent.session?.handle}</Text>;
}
