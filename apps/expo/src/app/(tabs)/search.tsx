import { Text, View } from "react-native";

import { useAuthedAgent } from "../../lib/agent";

export default function SearchPage() {
  const agent = useAuthedAgent();

  return (
    <View className="flex-1 justify-center">
      <Text className="text-center text-xl">Coming soon</Text>
    </View>
  );
}
