import { Text, TextInput, View } from "react-native";
import { Stack } from "expo-router";

export default function ComposeModal() {
  return (
    <View className="flex-1 p-4">
      <Stack.Screen
        options={{ headerTitle: "Compose a new post", presentation: "modal" }}
      />
      <Text>Write in here ig</Text>
      <TextInput className="mt-2 p-2" numberOfLines={3} multiline />
    </View>
  );
}
