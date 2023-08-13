import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { AlertTriangleIcon, CheckCircle2Icon } from "lucide-react-native";

import { useSelf } from ".";
import { Avatar } from "../../../components/avatar";
import { TextButton } from "../../../components/text-button";
import { useAgent } from "../../../lib/agent";
import { useLogOut } from "../../../lib/log-out-context";

export default function DeleteAccount() {
  const theme = useTheme();
  const agent = useAgent();

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
        logOut();
      }, 2000);
    },
    onError: (err) => {
      console.error(err);
      Alert.alert(
        "Error",
        "Please try again (are you sure your reset code was correct?)",
      );
    },
  });

  switch (stage) {
    case 1:
      return (
        <KeyboardAwareScrollView className="flex-1 px-4">
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
                  Warning: Account deletion is permanent
                </Text>
                <Text className="mt-1" style={{ color: theme.colors.text }}>
                  Deleting your Bluesky account will permanently remove all of
                  your data, including your profile, posts, follows, and likes.
                  This action cannot be undone.
                </Text>
              </View>
            </View>
          </View>
          <View className="flex-row items-center justify-center pt-2">
            {!sendEmail.isLoading ? (
              <TextButton
                onPress={() =>
                  Alert.alert(
                    "Double check that you understand",
                    "By pressing confirm, you understand that this is your actual Bluesky social account you will be deleting, and it is nothing to do with Graysky. Your data will be permanently deleted from the official app too.",
                    [
                      {
                        text: "Cancel",
                        style: "cancel",
                      },
                      {
                        text: "Confirm and continue",
                        onPress: () => sendEmail.mutate(),
                        style: "destructive",
                      },
                    ],
                  )
                }
                title="Send confirmation email"
                className="text-center font-medium"
              />
            ) : (
              <ActivityIndicator className="px-2" />
            )}
          </View>
        </KeyboardAwareScrollView>
      );
    case 2:
      return (
        <KeyboardAwareScrollView className="flex-1 px-4">
          <View className="my-4 flex-1">
            <View
              className="flex-row items-center rounded-lg px-4 py-3"
              style={{
                backgroundColor: theme.colors.card,
              }}
            >
              <Avatar size="large" />
              <View className="ml-4">
                <Text
                  style={{ color: theme.colors.text }}
                  className="text-base font-medium"
                >
                  {self.data?.displayName}
                </Text>
                <Text style={{ color: theme.colors.text }} className="text-sm">
                  @{self.data?.handle ?? agent?.session?.handle}
                </Text>
              </View>
            </View>
          </View>
          <View className="mb-4 flex-1">
            <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
              Deletion Code
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
                style={{ color: theme.colors.text }}
                placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
              />
            </View>
          </View>
          <View className="mb-4 flex-1">
            <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
              Password
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
                  style={{ color: theme.colors.text }}
                  placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
                />
              </View>
            </View>
          </View>
          <View className="flex-row items-center justify-between pt-2">
            <TextButton onPress={() => setStage(1)} title="Back" />
            {!changePassword.isLoading ? (
              <TextButton
                disabled={!token || !password}
                onPress={() => changePassword.mutate()}
                title="Delete Account"
                className="font-medium text-red-500"
              />
            ) : (
              <ActivityIndicator className="px-2" />
            )}
          </View>
        </KeyboardAwareScrollView>
      );
    case 3:
      return (
        <Animated.View
          entering={FadeIn}
          className="flex-1 items-center justify-center"
        >
          <CheckCircle2Icon size={64} color={theme.colors.primary} />
          <Text
            className="mt-8 text-center text-lg font-medium"
            style={{ color: theme.colors.text }}
          >
            Account deleted. Goodbye!
          </Text>
        </Animated.View>
      );
  }
}
