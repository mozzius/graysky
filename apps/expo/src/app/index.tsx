import { useEffect } from "react";
import { View } from "react-native";
import { useMMKVObject } from "react-native-mmkv";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ImageBackground, type ImageSource } from "expo-image";
import { useRouter } from "expo-router";
import { Trans } from "@lingui/react/macro";

import { LinkButton } from "~/components/button";
import { StatusBar } from "~/components/status-bar";
import { getReauthDid, type SavedSession } from "~/lib/session";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const background = require("../../assets/graysky.jpg") as ImageSource;

export default function LandingPage() {
  const [sessions] = useMMKVObject<SavedSession[]>("sessions");
  const router = useRouter();

  // after the switch from passwords to oauth, whoever was signed in gets a
  // one-time "sign in again" screen
  useEffect(() => {
    const did = getReauthDid();
    if (!did) return;
    const timeout = setTimeout(() => {
      router.push(`/reauth?did=${encodeURIComponent(did)}`);
    });
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View className="flex-1 bg-[#3B4245]">
      <StatusBar style="light" applyToNavigationBar />
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
              {/* <LinkButton href="/sign-up" variant="white">
                <Trans>Create an account</Trans>
              </LinkButton> */}
              <LinkButton
                href={sessions?.length ? "/resume" : "/sign-in"}
                variant="white"
                className="mt-4"
              >
                <Trans>Log in</Trans>
              </LinkButton>
            </Animated.View>
          </View>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
