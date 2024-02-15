import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { showToastable } from "react-native-toastable";
import { useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react-native";

import { Avatar } from "~/components/avatar";
import { TextButton } from "~/components/text-button";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { useLogOut } from "~/lib/log-out-context";
import { useSelf } from ".";

export default function DeleteAccount() {
  const theme = useTheme();
  const agent = useAgent();
  const router = useRouter();

  const self = useSelf();
  const logOut = useLogOut();

  const [stage, setStage] = useState<1 | 2 | 3>(1);
  const [token, setToken] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const sendEmail = useMutation({
    mutationKey: ["send-delete-email"],
    mutationFn: async () => {
      await agent.com.atproto.server.requestAccountDelete();
    },
    onSettled: () => setStage(2),
  });

  const changePassword = useMutation({
    mutationKey: ["delete-account"],
    mutationFn: async () => {
      if (!agent.session) throw Error("No session");
      await agent.com.atproto.server.deleteAccount({
        did: agent.session.did,
        password,
        token: token.trim(),
      });
    },
    onSuccess: () => {
      setStage(3);
      setTimeout(() => {
        router.push("../");
        logOut();
      }, 2000);
    },
    onError: (err) => {
      console.error(err);
      showToastable({
        title: "アカウントを削除できませんでした",
        message: err instanceof Error ? err.message : "不明なエラー",
        status: "danger",
      });
    },
  });

  switch (stage) {
    case 1:
      return (
        <TransparentHeaderUntilScrolled>
          <ScrollView
            className="flex-1 px-4"
            contentInsetAdjustmentBehavior="automatic"
          >
            <View className="my-4 flex-1">
              <View
                className="mt-4 flex-row rounded border-red-500 bg-red-50 p-3 pb-3 dark:bg-red-950"
                style={{
                  borderWidth: StyleSheet.hairlineWidth,
                }}
              >
                <AlertTriangleIcon
                  size={18}
                  className="mt-0.5 text-red-800 dark:text-white"
                />
                <View className="ml-3 flex-1">
                  <Text className="text-base font-medium leading-5 text-red-800 dark:text-white">
                    警告: アカウントの削除は永久的です
                  </Text>
                  <Text className="mt-1">
                    Blueskyのアカウントを削除すると、すべてが完全に削除されます。
                    プロフィール、投稿、フォローなどのデータ、いいねなどのデータが削除されます。
                    この操作は戻す事はできません。
                  </Text>
                </View>
              </View>
            </View>
            <View className="flex-row items-center justify-center pt-2">
              {!sendEmail.isPending ? (
                <TextButton
                  onPress={() =>
                    Alert.alert(
                      "理解をしている事をご確認ください",
                      "確認を押す事で削除しようとしている物は、「Blueskyのアカウント」であり、「Grayskyではない事を理解した」と見なされます。公式アプリからもデータは完全に削除されます。",
                      [
                        {
                          text: "キャンセル",
                          style: "cancel",
                        },
                        {
                          text: "確認と続行",
                          onPress: () => sendEmail.mutate(),
                          style: "destructive",
                        },
                      ],
                    )
                  }
                  title="確認のメールを送信"
                  className="text-center font-medium"
                />
              ) : (
                <ActivityIndicator className="px-2" />
              )}
            </View>
          </ScrollView>
        </TransparentHeaderUntilScrolled>
      );
    case 2:
      return (
        <TransparentHeaderUntilScrolled>
          <ScrollView
            className="flex-1 px-4"
            contentInsetAdjustmentBehavior="automatic"
          >
            <View className="my-4 flex-1">
              <View
                className="flex-row items-center rounded-lg px-4 py-3"
                style={{
                  backgroundColor: theme.colors.card,
                }}
              >
                <Avatar self size="large" />
                <View className="ml-4">
                  <Text className="text-base font-medium">
                    {self.data?.displayName}
                  </Text>
                  <Text className="text-sm">
                    @{self.data?.handle ?? agent?.session?.handle}
                  </Text>
                </View>
              </View>
            </View>
            <View className="mb-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                削除コード
              </Text>
              <View
                style={{ backgroundColor: theme.colors.card }}
                className="flex-1 overflow-hidden rounded-lg"
              >
                <TextInput
                  value={token}
                  placeholder="ABCDE-ABCDE"
                  onChange={(evt) => setToken(evt.nativeEvent.text)}
                  className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                />
              </View>
            </View>
            <View className="mb-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                パスワード
              </Text>
              <View
                style={{ backgroundColor: theme.colors.card }}
                className="flex-1 overflow-hidden rounded-lg"
              >
                <View
                  style={{ backgroundColor: theme.colors.card }}
                  className="flex-1 overflow-hidden rounded-lg"
                >
                  <TextInput
                    value={password}
                    secureTextEntry
                    onChange={(evt) => setPassword(evt.nativeEvent.text)}
                    className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                  />
                </View>
              </View>
            </View>
            <View className="flex-row items-center justify-between pt-2">
              <TextButton onPress={() => setStage(1)} title="戻る" />
              {!changePassword.isPending ? (
                <TextButton
                  disabled={!token || !password}
                  onPress={() => changePassword.mutate()}
                  title="アカウントを削除"
                  className="font-medium text-red-500"
                />
              ) : (
                <ActivityIndicator className="px-2" />
              )}
            </View>
          </ScrollView>
        </TransparentHeaderUntilScrolled>
      );
    case 3:
      return (
        <Animated.View
          entering={FadeIn}
          className="flex-1 items-center justify-center"
        >
          <CheckCircle2Icon size={64} color={theme.colors.primary} />
          <Text className="mt-8 text-center text-lg font-medium">
            アカウントは削除されました。さようなら!
          </Text>
        </Animated.View>
      );
  }
}
