import {
  ImageBackground,
  Text,
  View,
  type ImageSourcePropType,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

import { LinkButton } from "../components/button";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const background = require("../../assets/graysky.png") as ImageSourcePropType;

export default function LandingPage() {
  return (
    <View className="flex-1">
      <StatusBar style="light" />
      <Stack.Screen options={{ header: () => null }} />
      <ImageBackground className="flex-1" source={background}>
        <SafeAreaView className="flex flex-1 items-stretch justify-between p-4">
          <Text className="mx-auto mt-16 text-6xl font-bold text-white">
            GRAYSKY
          </Text>
          <LinkButton href="/login" variant="white">
            Log in
          </LinkButton>
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}
