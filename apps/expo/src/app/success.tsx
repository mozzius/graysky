import { TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { SparklesIcon } from "lucide-react-native";

import { Confetti } from "~/components/confetti";
import { Text } from "~/components/themed/text";

export default function SuccessScreen() {
  return (
    <SafeAreaView className="flex-1 p-4">
      <View className="flex-1">
        <SparklesIcon size={80} strokeWidth={1.5} className="mx-auto mt-16" />
        <Text className="mx-auto mt-6 max-w-[210px] text-center text-3xl">
          Welcome to Graysky Pro!
        </Text>
      </View>
      <Link href="../" asChild>
        <TouchableHighlight
          className="rounded-xl"
          style={{ borderCurve: "continuous" }}
        >
          <View
            className="min-h-[56px] w-full items-center rounded-xl bg-blue-500 py-4"
            style={{ borderCurve: "continuous" }}
          >
            <Text className="text-center text-base font-medium text-white">
              Done
            </Text>
          </View>
        </TouchableHighlight>
      </Link>
      <Confetti run={true} />
    </SafeAreaView>
  );
}
