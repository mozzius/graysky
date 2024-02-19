import { Alert, ScrollView, TouchableHighlight, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Trans } from "@lingui/macro";
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
          <Text className="mt-8 text-center text-3xl">
            <Trans>Push Notifications</Trans>
          </Text>
          <Text className="mt-4 max-w-[510px] text-center text-base">
            <Trans>
              You can receive push notifications for likes, replies, and more!
              However, there are some caveats you should be aware of.
            </Trans>
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
              <Trans>
                You might receive the same notifications via other Bluesky
                clients.
              </Trans>
            </Text>
          </View>
          <View className="flex-row items-start">
            <DotIcon
              size={20}
              className="mr-2 mt-1"
              color={theme.colors.text}
            />
            <Text className="flex-1 text-base">
              <Trans>
                You may receive notifications from people you have muted.{" "}
                <Text
                  primary
                  onPress={() =>
                    Alert.alert(
                      "Notifications from muted users",
                      "For your privacy, our server can't know who you've muted. This means you may receive notifications from muted users. We're working on a solution to this.",
                    )
                  }
                >
                  Learn more
                </Text>
              </Trans>
            </Text>
          </View>
          <View className="flex-row items-start">
            <DotIcon
              size={20}
              className="mr-2 mt-1"
              color={theme.colors.text}
            />
            <Text className="flex-1 text-base">
              <Trans>
                You may receive notifications from people you{"'"}ve blocked or
                muted via moderation list.{" "}
                <Text
                  primary
                  onPress={() =>
                    Alert.alert(
                      "Moderation lists",
                      "Our server can't currently tell what moderation lists you've subscribed to. This will likely change in the future, as we improve our software.",
                    )
                  }
                >
                  Learn more
                </Text>
              </Trans>
            </Text>
          </View>
        </View>
      </ScrollView>
      <View className="px-4 pb-2">
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
            className="w-full items-center rounded-xl py-3"
            style={{
              borderCurve: "continuous",
              backgroundColor: theme.colors.primary,
            }}
          >
            <Text className="text-center text-base font-medium text-white">
              <Trans>Enable notifications</Trans>
            </Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          className="mt-2.5 rounded-xl"
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
            className="w-full items-center rounded-xl bg-neutral-100 py-3 dark:bg-neutral-800"
            style={{ borderCurve: "continuous" }}
          >
            <Text className="text-center text-base font-medium">
              <Trans>Don{"'"}t enable</Trans>
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    </SafeAreaView>
  );
}
