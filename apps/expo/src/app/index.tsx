import { ImageBackground, View, type ImageSourcePropType } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { LinkButton } from "../components/button";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const background = require("../../assets/graysky.png") as ImageSourcePropType;

export default function LandingPage() {
  return (
    <View className="flex-1 bg-[#3B4245]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <ImageBackground className="flex-1" source={background}>
        <SafeAreaView className="flex-1 items-stretch justify-between p-4">
          <View>
            <Animated.Text
              entering={FadeIn.delay(750)}
              className="mx-auto mt-10 text-center text-7xl font-medium text-white"
            >
              graysky
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(1000)}
              className="mx-auto text-center text-xl font-medium text-white"
            >
              a bluesky client
            </Animated.Text>
          </View>
          <View className="relative">
            <Animated.View entering={FadeIn.delay(1250)}>
              <LinkButton href="/login" variant="white">
                Log in
              </LinkButton>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
