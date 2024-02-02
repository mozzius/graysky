import { Alert, ScrollView, TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { BellRingIcon, DotIcon } from "lucide-react-native";

import { BackButtonOverride } from "~/components/back-button-override";
import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { useSetAppPreferences } from "~/lib/storage/app-preferences";

export default function PushNotificationsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const setAppPreferences = useSetAppPreferences();

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: theme.colors.card }}
      edges={["bottom"]}
    >
      <StatusBar modal />
      <BackButtonOverride />
      <ScrollView className="flex-1 px-4">
        <View className="mt-24 flex-1 items-center">
          <BellRingIcon
            color={theme.colors.primary}
            size={80}
            strokeWidth={1.5}
          />
          <Text className="mt-8 text-center text-3xl">Push Notifications</Text>
          <Text className="mt-4 max-w-[510px] text-center text-base">
            You can recieve push notifications for likes, replies, and more!
            However, there are some caveats you should be aware of.
          </Text>
        </View>
        <View className="mt-8 flex-1 flex-col space-y-2">
          <View className="flex-row items-start">
            <DotIcon
              size={20}
              className="mr-2 mt-1"
              color={theme.colors.text}
            />
            <Text className="flex-1 text-base">
              You might receieve the same notifications via other Bluesky
              clients.
            </Text>
          </View>
          <View className="flex-row items-start">
            <DotIcon
              size={20}
              className="mr-2 mt-1"
              color={theme.colors.text}
            />
            <Text className="flex-1 text-base">
              You may receive notifications from people you have muted.{" "}
              <Text
                primary
                onPress={() =>
                  Alert.alert(
                    "Notifications from muted users",
                    "Our server can't know who you've muted, for your privacy. This means you may receive notifications from muted users. We're working on a solution to this.",
                  )
                }
              >
                Learn more
              </Text>
            </Text>
          </View>
          <View className="flex-row items-start">
            <DotIcon
              size={20}
              className="mr-2 mt-1"
              color={theme.colors.text}
            />
            <Text className="flex-1 text-base">
              You may recieve notifications from people you{"'"}ve blocked/muted
              via moderation list.{" "}
              <Text
                primary
                onPress={() =>
                  Alert.alert(
                    "Moderation lists",
                    "Our server can't currently tell what moderation lists you've subscribed to. This will likely change in the future, as we improve our software",
                  )
                }
              >
                Learn more
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
      <View className="px-4">
        <TouchableHighlight
          className="rounded-xl"
          style={{ borderCurve: "continuous" }}
          onPress={() => {
            setAppPreferences({
              enableNotifications: true,
              hasPromptedForNotifications: true,
            });
            router.push("../");
          }}
        >
          <View
            className="min-h-[56px] w-full items-center rounded-xl py-4"
            style={{
              borderCurve: "continuous",
              backgroundColor: theme.colors.primary,
            }}
          >
            <Text className="text-center text-base font-medium text-white">
              Enable notifications
            </Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          className="mt-4 rounded-xl"
          style={{ borderCurve: "continuous" }}
          onPress={() => {
            setAppPreferences({
              enableNotifications: false,
              hasPromptedForNotifications: true,
            });
            router.push("../");
          }}
        >
          <View
            className="min-h-[56px] w-full items-center rounded-xl bg-neutral-100 py-4 dark:bg-neutral-800"
            style={{ borderCurve: "continuous" }}
          >
            <Text className="text-center text-base font-medium">
              Don{"'"}t enable
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    </SafeAreaView>
  );
}
