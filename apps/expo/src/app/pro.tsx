import { useState } from "react";
import {
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
} from "react-native";
import Purchases from "react-native-purchases";
import Animated, { FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { showToastable } from "react-native-toastable";
import { BlurView } from "expo-blur";
import { ImageBackground } from "expo-image";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LanguagesIcon, MoreHorizontalIcon } from "lucide-react-native";
import * as Sentry from "sentry-expo";

import { StatusBar } from "~/components/status-bar";
import { useOfferings } from "~/lib/hooks/purchases";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const background = require("../../assets/graysky.png") as ImageSourcePropType;

export default function Pro() {
  const offerings = useOfferings();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [annual, setAnnual] = useState(false);

  const subscribe = useMutation({
    mutationKey: ["subscribe"],
    mutationFn: async () => {
      if (!offerings.data) return;
      try {
        if (annual) {
          if (!offerings.data.current?.annual) throw Error("No annual package");
          await Purchases.purchasePackage(offerings.data.current.annual);
        } else {
          if (!offerings.data.current?.monthly)
            throw Error("No monthly package");
          await Purchases.purchasePackage(offerings.data.current.monthly);
        }
        await queryClient.refetchQueries(["purchases", "info"]);
      } catch (err) {
        // @ts-expect-error - rn-purchases doesn't seem to export error type
        if (err.userCancelled) return;
        throw err;
      }
    },
    onSuccess: () => {
      showToastable({
        title: "Purchase successful",
        message: "Welcome to Graysky Pro!",
        status: "success",
      });
    },
    onError: (err) => {
      console.error(err);
      Sentry.Native.captureException(err, { extra: { annual } });
      showToastable({
        title: "Could not complete purchase",
        message: "Something went wrong, please try again later.",
        status: "danger",
      });
    },
  });

  const restore = useMutation({
    mutationKey: ["restore"],
    mutationFn: async () => {
      await Purchases.restorePurchases();
      await queryClient.refetchQueries(["purchases", "info"]);
    },
  });

  const features = [
    {
      colour: "rgb(59, 130, 246)",
      title: "Inline Translations",
      subtitle: "Get translations in app",
      icon: <LanguagesIcon className="text-white" />,
    },
    {
      colour: "rgb(192, 38, 211)",
      title: "And a lot more planned...",
      subtitle: "Polls, analytics, and more",
      icon: <MoreHorizontalIcon className="text-white" />,
    },
  ] satisfies Omit<Props, "index">[];

  return (
    <View className="flex-1 bg-[#3B4245]">
      <StatusBar modal />
      <ImageBackground className="flex-1" source={background} blurRadius={4}>
        <SafeAreaView className="flex-1 items-stretch justify-between bg-black/40 p-4">
          <ScrollView>
            <Animated.Text
              className="mb-8 mt-4 text-center text-6xl font-semibold text-white"
              entering={FadeInDown.delay(500).duration(300).springify()}
            >
              Graysky Pro
            </Animated.Text>
            {features.map((feature, index) => (
              <FeatureItem key={feature.title} {...feature} index={index} />
            ))}
          </ScrollView>
          {offerings.data && (
            <View>
              <TouchableOpacity
                onPress={() => subscribe.mutate()}
                disabled={subscribe.isLoading}
              >
                <View
                  className="w-full rounded-xl bg-blue-500 py-4"
                  style={{ borderCurve: "continuous" }}
                >
                  <Text className="text-center text-base font-medium text-white">
                    Subscribe (
                    {annual
                      ? `${offerings.data.current?.annual?.product?.priceString} / year`
                      : `${offerings.data.current?.monthly?.product?.priceString} / month`}
                    )
                  </Text>
                </View>
              </TouchableOpacity>
              <View
                className="mt-4 overflow-hidden rounded-xl"
                style={{ borderCurve: "continuous" }}
              >
                <BlurView
                  className="flex-row items-center justify-between p-4"
                  tint="dark"
                >
                  <Text className="text-base text-white">
                    Switch to annual plan (16.5% off)
                  </Text>
                  <Switch
                    value={annual}
                    onValueChange={(val) => setAnnual(val)}
                    trackColor={{
                      false: theme.colors.card,
                      true: theme.colors.primary,
                    }}
                  />
                </BlurView>
              </View>
              <TouchableOpacity
                onPress={() => restore.mutate()}
                disabled={restore.isLoading}
              >
                <Text>
                  {restore.isLoading
                    ? "Restoring purchases..."
                    : "Restore purchases"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </SafeAreaView>
      </ImageBackground>
    </View>
  );
}

interface Props {
  icon: React.ReactElement;
  title: string;
  subtitle: string;
  colour: string;
  index: number;
}

const FeatureItem = ({ icon, title, subtitle, colour, index }: Props) => (
  <Animated.View
    className="flex-row items-center px-8 py-3"
    entering={FadeInDown.delay(750 + index * 300)
      .duration(300)
      .springify()}
  >
    <View
      className="h-10 w-10 items-center justify-center rounded"
      style={{ backgroundColor: colour }}
    >
      {icon}
    </View>
    <View className="flex-1 justify-center pl-4">
      <Text className="text-lg font-medium leading-5 text-white">{title}</Text>
      <Text className="text-base leading-5 text-white">{subtitle}</Text>
    </View>
  </Animated.View>
);
