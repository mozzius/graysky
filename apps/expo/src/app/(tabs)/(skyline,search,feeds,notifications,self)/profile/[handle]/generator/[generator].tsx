import { Text, View } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

export default function FeedPage() {
  const { handle, generator } = useLocalSearchParams();

  return (
    <View>
      <Stack.Screen options={{ title: "Feed" }} />
      <Text className="dark:text-neutral-50">{generator}</Text>
    </View>
  );
}
