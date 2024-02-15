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
          <Text className="mt-8 text-center text-3xl">プッシュ通知</Text>
          <Text className="mt-4 max-w-[510px] text-center text-base">
            「いいね」や「返信」などのプッシュ通知を受け取る事ができます。
            ただし、注意すべき点も存在します。
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
              他のBlueskyクライアントでも同じ通知が
              届くかもしれません。
            </Text>
          </View>
          <View className="flex-row items-start">
            <DotIcon
              size={20}
              className="mr-2 mt-1"
              color={theme.colors.text}
            />
            <Text className="flex-1 text-base">
              ミュートをしたユーザーから通知が来る事があります。{" "}
              <Text
                primary
                onPress={() =>
                  Alert.alert(
                    "ミュートをしたユーザーからの通知",
                    "プライバシー保護のため、ミュートをしたユーザーをサーバーが知る事はできません。つまり、ミュートをしたユーザーからの通知を受け取る可能性があります。現在、解決策を検討中です。",
                  )
                }
              >
                さらに詳しく
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
              あなたがブロックまたはミュートをした相手からの通知を受け取る事があります。
              モデレーションリストでミュートをした人からの通知を受け取る事があります。{" "}
              <Text
                primary
                onPress={() =>
                  Alert.alert(
                    "モデレーションリスト",
                    "私たちのサーバーは現在、購読しているモデレーションリストを知る事ができません。今後、ソフトウェアの改良に伴い、変更される可能性があります。",
                  )
                }
              >
                さらに詳しく
              </Text>
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
              通知を有効化する
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
              Don{"'"}t enable
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    </SafeAreaView>
  );
}
