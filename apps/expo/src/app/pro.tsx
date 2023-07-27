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
import { ImageBackground } from "expo-image";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import {
  Bookmark,
  Languages,
  LineChart,
  Users,
  Vote,
} from "lucide-react-native";

import { useOfferings } from "../lib/hooks/purchases";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const background = require("../../assets/graysky.png") as ImageSourcePropType;

export default function Pro() {
  const offerings = useOfferings();
  const theme = useTheme();

  const [annual, setAnnual] = useState(false);

  const subscribe = useMutation({
    mutationKey: ["subscribe"],
    mutationFn: async () => {
      if (!offerings.data) return;
      // if (annual) {
      //   if (!offerings.data.current?.annual) throw Error("No annual package")
      //   Purchases.purchaseStoreProduct(offerings.data.current.annual.product.);
      // } else {
      //   Purchases.purchaseSubscriptionOption();
      // }
    },
  });

  const features = [
    {
      colour: "rgb(239, 68, 68)",
      title: "Bookmarks",
      subtitle: "Save posts for later",
      icon: <Bookmark className="text-white" />,
    },
    {
      colour: "rgb(59, 130, 246)",
      title: "Inline Translations",
      subtitle: "Get translations in app",
      icon: <Languages className="text-white" />,
    },
    {
      colour: "rgb(192, 38, 211)",
      title: "Polls",
      subtitle: "Seamlessly integrated polling",
      icon: <Vote className="text-white" />,
    },
    {
      colour: "rgb(22, 163, 74)",
      title: "Multiple Accounts",
      subtitle: "Perform actions across accounts",
      icon: <Users className="text-white" />,
    },
    {
      colour: "rgb(202, 138, 4)",
      title: "Analytics (coming soon)",
      subtitle: "Stay tuned...",
      icon: <LineChart className="text-white" />,
    },
  ] satisfies Omit<Props, "index">[];

  return (
    <View className="flex-1 bg-[#3B4245]">
      <StatusBar style="light" />
      <ImageBackground className="flex-1" source={background} blurRadius={4}>
        <SafeAreaView className="flex-1 items-stretch justify-between bg-black/40 p-4">
          <ScrollView>
            <Animated.Text
              className="mb-8 mt-4 text-center text-6xl font-semibold text-white"
              entering={FadeInDown.delay(500)}
            >
              Graysky Pro
            </Animated.Text>
            {features.map((feature, index) => (
              <FeatureItem {...feature} index={index} />
            ))}
          </ScrollView>
          {/* {offerings.data && ( */}
          <View>
            <View className="mb-4 flex-row items-center justify-between rounded-xl bg-black/70 p-4">
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
            </View>
            <TouchableOpacity
              onPress={() => subscribe.mutate()}
              disabled={subscribe.isLoading}
            >
              <View className="w-full rounded-xl bg-blue-500 py-4">
                <Text className="text-center text-base font-medium text-white">
                  Subscribe (
                  {annual
                    ? `${offerings.data?.current?.annual?.product?.priceString} / year`
                    : `${offerings.data?.current?.monthly?.product?.priceString} / month`}
                  )
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          {/* )} */}
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
    entering={FadeInDown.delay(750 + index * 200)}
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
