import { TouchableHighlight, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Link } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { CheckIcon, SparklesIcon } from "lucide-react-native";

import { AccentColourSelect } from "~/components/accent-colour-select";
import { Confetti } from "~/components/confetti";
import { Text } from "~/components/themed/text";

export default function SuccessScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView className="flex-1 p-4">
      <View className="flex-1">
        <Animated.View
          entering={ZoomIn.delay(1000)}
          className="mt-16 items-center"
        >
          <SparklesIcon
            color={theme.colors.primary}
            size={80}
            strokeWidth={1.5}
          />
          <Text className="mt-6 max-w-[210px] text-center text-3xl">
            Welcome to Graysky Pro!
          </Text>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(2000)}
          className="mt-12 flex-row items-center px-4"
        >
          <CheckIcon size={20} className="mr-2" color={theme.colors.text} />
          <Text className="text-base">
            Translations are now powered by DeepL
          </Text>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(2500)}
          className="mt-4 flex-row items-center px-4"
        >
          <CheckIcon size={20} className="mr-2" color={theme.colors.text} />
          <Text className="text-base">
            You can now change the accent colour
          </Text>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(3000)} className="mt-4 h-14">
          <AccentColourSelect />
        </Animated.View>
      </View>
      <Animated.View entering={FadeInDown.delay(5000)}>
        <Link href="../" asChild>
          <TouchableHighlight
            className="rounded-xl"
            style={{ borderCurve: "continuous" }}
          >
            <View
              className="min-h-[56px] w-full items-center rounded-xl py-4"
              style={{
                borderCurve: "continuous",
                backgroundColor: theme.colors.primary,
              }}
            >
              <Text className="text-center text-base font-medium text-white">
                Done
              </Text>
            </View>
          </TouchableHighlight>
        </Link>
      </Animated.View>
      <Confetti run={true} />
    </SafeAreaView>
  );
}
