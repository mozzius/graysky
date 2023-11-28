import { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
  type ImageSourcePropType,
  type ViewStyle,
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
  // LineChart,
  MoreHorizontalIcon,
  XIcon,
} from "lucide-react-native";
import * as Sentry from "sentry-expo";

import { StatusBar } from "~/components/status-bar";
import { useAgent } from "~/lib/agent";
import { useCustomerInfo, useIsPro, useOfferings } from "~/lib/hooks/purchases";
import { cx } from "~/lib/utils/cx";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const background = require("../../assets/graysky.png") as ImageSourcePropType;

export default function Pro() {
  const offerings = useOfferings();
  const queryClient = useQueryClient();
  const router = useRouter();
  const customerInfo = useCustomerInfo();
  const isPro = useIsPro();
  const agent = useAgent();

  const [annual, setAnnual] = useState(false);

  const subscribe = useMutation({
    mutationKey: ["subscribe"],
    mutationFn: async () => {
      if (!offerings.data) return "CANCELLED";
      try {
        let plan;
        if (annual) {
          if (!offerings.data.current?.annual) throw Error("No annual package");
          plan = offerings.data.current.annual;
        } else {
          if (!offerings.data.current?.monthly)
            throw Error("No monthly package");
          plan = offerings.data.current.monthly;
        }
        await Purchases.setDisplayName(agent.session?.handle ?? null);
        await Purchases.purchasePackage(plan);
        await queryClient.refetchQueries({ queryKey: ["purchases", "info"] });
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
      await queryClient.refetchQueries({ queryKey: ["purchases", "info"] });
    },
  });

  const features = [
    {
      colour: "rgb(59, 130, 246)",
      title: "Better Translations",
      subtitle: "Translate posts using DeepL",
      icon: <LanguagesIcon className="text-white" />,
    },
    // {
    //   colour: "rgb(202, 138, 4)",
    //   title: "Analytics",
    //   subtitle: "See how your posts are doing",
    //   icon: <LineChart className="text-white" />,
    // },
    {
      colour: "rgb(192, 38, 211)",
      title: "And a lot more planned...",
      subtitle: "Analytics, polls, and much more",
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
          headerTransparent: true,
          headerRight: () => (
            <TouchableHighlight
              className="rounded-full"
              onPress={() => router.push("../")}
            >
              <View className="flex-1 rounded-full bg-neutral-800 p-2">
                <XIcon className="text-white" size={18} strokeWidth={3} />
              </View>
            </TouchableHighlight>
          ),
        }}
      />
      <ImageBackground className="flex-1" source={background} blurRadius={4}>
        <View className="flex-1 bg-black/40">
          <ScrollView fadingEdgeLength={20} indicatorStyle="white">
            <Animated.Text
              className="mb-8 mt-24 text-center text-6xl font-semibold text-white"
              entering={FadeInDown.delay(500).duration(300).springify()}
            >
              Graysky Pro
            </Animated.Text>
            {features.map((feature, index) => (
              <FeatureItem key={feature.title} {...feature} index={index} />
            ))}
          </ScrollView>
          <SafeAreaView edges={["left", "bottom", "right"]} className="px-4">
            {isPro ? (
              <View>
                <View
                  className="w-full flex-row items-center justify-center rounded-xl bg-neutral-50 py-4"
                  style={{ borderCurve: "continuous" }}
                >
                  <CheckIcon className="mr-2 text-black" size={20} />
                  <Text className="text-center text-base font-medium text-black">
                    Currently subscribed
                    {customerInfo?.entitlements.active.pro?.periodType &&
                      ` (${customerInfo.entitlements.active.pro.periodType})`}
                  </Text>
                </View>
                <Text className="mb-4 mt-4 px-12 text-center text-sm text-white">
                  To manage your subscription, please visit the{" "}
                  {Platform.select({
                    ios: "App Store",
                    android: "Play Store",
                    default: "???? store",
                  })}
                  .
                </Text>
              </View>
            ) : (
              annualProduct &&
              monthlyProduct && (
                <View>
                  <BlurPill active={!annual} onPress={() => setAnnual(false)}>
                    <Text className="text-base text-white">Monthly Plan</Text>
                    <Text className="text-base text-white">
                      {monthlyProduct.priceString} / month
                    </Text>
                  </BlurPill>
                  <BlurPill
                    active={annual}
                    onPress={() => setAnnual(true)}
                    className="mt-4"
                  >
                    <Text className="text-base text-white">
                      Annual Plan (
                      {Math.round(
                        1000 -
                          (annualProduct.price / (monthlyProduct.price * 12)) *
                            1000,
                      ) / 10}
                      % off)
                    </Text>
                    <Text className="text-base text-white">
                      {annualProduct.priceString} / year
                    </Text>
                  </BlurPill>
                  <TouchableHighlight
                    onPress={() => subscribe.mutate()}
                    disabled={subscribe.isPending}
                    className="mt-4 rounded-xl"
                    style={{ borderCurve: "continuous" }}
                  >
                    <View
                      className="min-h-[56px] w-full items-center rounded-xl bg-blue-500 py-4"
                      style={{ borderCurve: "continuous" }}
                    >
                      {subscribe.isPending ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <Text className="text-center text-base font-medium text-white">
                          Get Graysky Pro
                        </Text>
                      )}
                    </View>
                  </TouchableHighlight>
                  <TouchableOpacity
                    onPress={() => restore.mutate()}
                    disabled={restore.isPending}
                    className="mt-4 w-full py-2"
                  >
                    <Text className="text-center text-base text-blue-500">
                      {restore.isPending
                        ? "Restoring purchases..."
                        : "Restore purchases"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            )}
          </SafeAreaView>
        </View>
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
      .duration(100)
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

const BlurPill = ({
  children,
  active,
  className,
  style,
  onPress,
}: {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  style?: ViewStyle;
  onPress?: () => void;
}) => (
  <TouchableOpacity
    onPress={onPress}
    className={cx("rounded-xl", className)}
    style={style}
  >
    <View
      className="overflow-hidden rounded-xl"
      style={{ borderCurve: "continuous" }}
    >
      <BlurView tint="dark">
        <View
          className={cx(
            "flex-row items-center justify-between rounded-xl border-2 p-4",
            active ? "border-blue-500" : "border-transparent",
          )}
        >
          {children}
        </View>
      </BlurView>
    </View>
  </TouchableOpacity>
);
