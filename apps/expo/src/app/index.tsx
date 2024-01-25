import { View, type ImageSourcePropType } from "react-native";
import { useMMKVObject } from "react-native-mmkv";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageBackground } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { type AtpSessionData } from "@atproto/api";

import { LinkButton } from "~/components/button";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const background = require("../../assets/graysky.png") as ImageSourcePropType;

export default function LandingPage() {
  const [sessions] = useMMKVObject<AtpSessionData[]>("sessions");

  return (
    <View className="flex-1 bg-[#3B4245]">
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ImageBackground className="flex-1" source={background}>
        <SafeAreaView className="flex-1 items-stretch justify-between p-4">
          <View>
            <Animated.Text
              entering={FadeIn.delay(100)}
              className="mt-10 text-center text-6xl font-medium text-white sm:text-7xl"
              // already quite big, so don't scale it up too much
              maxFontSizeMultiplier={1.5}
            >
              Graysky
            </Animated.Text>
            <Animated.Text
              entering={FadeIn.delay(250)}
              className="text-center text-xl font-medium text-white"
              maxFontSizeMultiplier={2}
            >
              a bluesky client
            </Animated.Text>
          </View>
          <View className="relative items-center">
            <Animated.View
              entering={FadeInDown.delay(500)}
              className="w-full max-w-xl"
            >
              <LinkButton href="/sign-up" variant="white">
                Create an account
              </LinkButton>
              <LinkButton
                href={sessions?.length ? "/resume" : "/sign-in"}
                variant="black"
                className="mt-4"
              >
                Log in
              </LinkButton>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
