import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
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
import { Stack, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckIcon,
  LanguagesIcon,
  LineChart,
  MoreHorizontalIcon,
} from "lucide-react-native";
import * as Sentry from "sentry-expo";

import { StatusBar } from "~/components/status-bar";
import { useCustomerInfo, useIsPro, useOfferings } from "~/lib/hooks/purchases";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const background = require("../../assets/graysky.png") as ImageSourcePropType;

export default function Pro() {
  const offerings = useOfferings();
  const queryClient = useQueryClient();
  const router = useRouter();
  const customerInfo = useCustomerInfo();
  const isPro = useIsPro();

  const [annual, setAnnual] = useState(false);

  const subscribe = useMutation({
    mutationKey: ["subscribe"],
    mutationFn: async () => {
      if (!offerings.data) return "CANCELLED";
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
        if (err.userCancelled) return "CANCELLED";
        throw err;
      }
    },
    onSuccess: (res) => {
      if (res === "CANCELLED") return;
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
      title: "Better Translations",
      subtitle: "Unlimited DeepL translations",
      icon: <LanguagesIcon className="text-white" />,
    },
    {
      colour: "rgb(202, 138, 4)",
      title: "Analytics",
      subtitle: "See how your posts are doing",
      icon: <LineChart className="text-white" />,
    },
    {
      colour: "rgb(192, 38, 211)",
      title: "And a lot more planned...",
      subtitle: "Polls and much more",
      icon: <MoreHorizontalIcon className="text-white" />,
    },
  ] satisfies Omit<Props, "index">[];

  const annualProduct = offerings.data?.current?.annual?.product;
  const monthlyProduct = offerings.data?.current?.monthly?.product;

  return (
    <View className="flex-1 bg-[#3B4245]">
      <StatusBar modal />
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push("../")}>
              <Text className="text-lg font-medium text-white">Done</Text>
            </TouchableOpacity>
          ),
        }}
      />
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
          {isPro ? (
            <View>
              <View
                className="w-full flex-row items-center justify-center rounded-xl bg-neutral-50 py-4"
                style={{ borderCurve: "continuous" }}
              >
                <CheckIcon className="mr-2 text-black" size={20} />
                <Text className="text-center text-base font-medium text-black">
                  Currently Subscribed
                  {customerInfo?.entitlements.active.pro?.periodType &&
                    ` (${customerInfo.entitlements.active.pro.periodType})`}
                </Text>
              </View>
              <Text className="mt-4 px-12 text-center text-sm text-white">
                To manage your subscription, please visit the{" "}
                {Platform.select({
                  ios: "App Store",
                  android: "Play Store",
                  default: "magical store that doesn't exist",
                })}
                .
              </Text>
            </View>
          ) : (
            annualProduct &&
            monthlyProduct && (
              <View>
                <TouchableOpacity
                  onPress={() => subscribe.mutate()}
                  disabled={subscribe.isLoading}
                >
                  <View
                    className="w-full rounded-xl bg-blue-500 py-4"
                    style={{ borderCurve: "continuous" }}
                  >
                    {subscribe.isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-center text-base font-medium text-white">
                        Subscribe (
                        {annual
                          ? `${annualProduct.priceString} / year`
                          : `${monthlyProduct.priceString} / month`}
                        )
                      </Text>
                    )}
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
                      Switch to annual plan (
                      {Math.round(
                        1000 -
                          (annualProduct.price / (monthlyProduct.price * 12)) *
                            1000,
                      ) / 10}
                      % off)
                    </Text>
                    <Switch
                      value={annual}
                      onValueChange={(val) => setAnnual(val)}
                      disabled={subscribe.isLoading}
                    />
                  </BlurView>
                </View>
                <TouchableOpacity
                  onPress={() => restore.mutate()}
                  disabled={restore.isLoading}
                  className="mt-4 w-full py-2"
                >
                  <Text className="text-center text-base text-blue-500">
                    {restore.isLoading
                      ? "Restoring purchases..."
                      : "Restore purchases"}
                  </Text>
                </TouchableOpacity>
              </View>
            )
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
