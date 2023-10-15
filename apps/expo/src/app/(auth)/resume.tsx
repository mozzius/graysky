import { ScrollView, View } from "react-native";
import { useMMKVObject } from "react-native-mmkv";
import { Redirect } from "expo-router";

import { Text } from "~/components/text";
import { store } from "~/lib/storage";
import {
  SwitchAccounts,
  type SavedSession,
} from "../../components/switch-accounts";

export default function ResumeSession() {
  const [sessions] = useMMKVObject<SavedSession[]>("sessions", store);

  if (!sessions || sessions.length === 0) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <ScrollView className="flex-1">
      <View className="flex-1 p-4">
        <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
          Log back in
        </Text>
        <SwitchAccounts sessions={sessions} chevrons />
      </View>
    </ScrollView>
  );
}
