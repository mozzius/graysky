import { useState } from "react";
import { ActivityIndicator, ScrollView, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { showToastable } from "react-native-toastable";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon } from "lucide-react-native";
import { z } from "zod";

import { useAgent } from "~/lib/agent";
import { TextButton } from "../text-button";
import { Text } from "../themed/text";
import { TextInput } from "../themed/text-input";
import { TransparentHeaderUntilScrolled } from "../transparent-header";

class PasswordError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PasswordError";
  }
}

interface Props {
  defaultEmail?: string;
}

enum Stage {
  EnterEmail,
  EnterResetCode,
  Success,
}

export const ChangePasswordFlow = ({ defaultEmail = "" }: Props) => {
  const theme = useTheme();
  const agent = useAgent();

  const [stage, setStage] = useState<Stage>(Stage.EnterEmail);
  const [email, setEmail] = useState<string>(defaultEmail);
  const [token, setToken] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState<string>("");
  const { _ } = useLingui();

  const sendEmail = useMutation({
    mutationKey: ["send-reset-email"],
    mutationFn: async () => {
      await agent.com.atproto.server.requestPasswordReset({
        email,
      });
    },
    onSettled: () => setStage(Stage.EnterResetCode),
  });

  const changePassword = useMutation({
    mutationKey: ["change-password"],
    mutationFn: async () => {
      if (newPassword.length < 8) {
        throw new PasswordError(_(msg`Password must be at least 8 characters`));
      }
      await agent.com.atproto.server.resetPassword({
        password: newPassword,
        token: token.trim(),
      });
    },
    onSuccess: () => setStage(Stage.Success),
    onError: (err) => {
      if (err instanceof PasswordError) {
        showToastable({
          title: err.message,
          message: _(msg`Please try again`),
          status: "danger",
        });
      } else {
        console.error(err);
        showToastable({
          title: _(msg`An error occured`),
          message: _(
            msg`Please try again - are you sure your reset code is correct?`,
          ),
          status: "danger",
        });
      }
    },
  });

  switch (stage) {
    case Stage.EnterEmail:
      return (
        <TransparentHeaderUntilScrolled>
          <ScrollView
            className="flex-1 px-4"
            contentInsetAdjustmentBehavior="automatic"
          >
            <View className="my-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                <Trans>Email</Trans>
              </Text>
              <View
                style={{ backgroundColor: theme.colors.card }}
                className="flex-1 overflow-hidden rounded-lg"
              >
                <TextInput
                  value={email}
                  autoComplete="email"
                  placeholder="alice@example.com"
                  onChange={(evt) => setEmail(evt.nativeEvent.text)}
                  className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                />
              </View>
            </View>
            <View className="flex-row items-center justify-end pt-2">
              {!sendEmail.isPending ? (
                <TextButton
                  disabled={!z.string().email().safeParse(email).success}
                  onPress={() => sendEmail.mutate()}
                  title={_(msg`Send reset email`)}
                  className="font-medium"
                />
              ) : (
                <ActivityIndicator className="px-2" />
              )}
            </View>
          </ScrollView>
        </TransparentHeaderUntilScrolled>
      );
    case Stage.EnterResetCode:
      return (
        <TransparentHeaderUntilScrolled>
          <ScrollView
            className="flex-1 px-4"
            contentInsetAdjustmentBehavior="automatic"
          >
            <View className="my-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                <Trans>Reset Code</Trans>
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
            <View className="flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                <Trans>New Password</Trans>
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
                    value={newPassword}
                    secureTextEntry
                    onChange={(evt) => setNewPassword(evt.nativeEvent.text)}
                    className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                  />
                </View>
              </View>
            </View>
            <View className="mb-4 flex-1">
              <Text className="mx-4 mb-1 mt-4 text-xs uppercase text-neutral-500">
                <Trans>Confirm Password</Trans>
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
                    value={newPasswordConfirm}
                    secureTextEntry
                    onChange={(evt) =>
                      setNewPasswordConfirm(evt.nativeEvent.text)
                    }
                    className="flex-1 flex-row items-center px-4 py-3 text-base leading-5"
                    style={{ color: theme.colors.text }}
                    placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
                    keyboardAppearance={theme.dark ? "dark" : "light"}
                  />
                </View>
              </View>
            </View>
            <View className="flex-row items-center justify-between pt-2">
              <TextButton
                onPress={() => setStage(Stage.EnterEmail)}
                title={_(msg`Back`)}
              />
              {!changePassword.isPending ? (
                <TextButton
                  disabled={
                    !token || !newPassword || newPassword !== newPasswordConfirm
                  }
                  onPress={() => changePassword.mutate()}
                  title={_(msg`Save`)}
                  className="font-medium"
                />
              ) : (
                <ActivityIndicator className="px-2" />
              )}
            </View>
          </ScrollView>
        </TransparentHeaderUntilScrolled>
      );
    case Stage.Success:
      return (
        <Animated.View
          entering={FadeIn}
          className="flex-1 items-center justify-center"
        >
          <CheckCircle2Icon size={64} color={theme.colors.primary} />
          <Text className="mt-8 text-center text-lg font-medium">
            <Trans>Password changed successfully!</Trans>
          </Text>
        </Animated.View>
      );
  }
};
