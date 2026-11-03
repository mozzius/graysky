import { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showToastable } from "react-native-toastable";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { LockIcon, ShieldAlertIcon, UserIcon } from "lucide-react-native";
import { z } from "zod";

import { Button } from "~/components/button";
import { TextButton } from "~/components/text-button";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAuth } from "~/lib/agent";
import { useLinkPress } from "~/lib/hooks/link-press";

export default function SignIn() {
  const { login: authLogin } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { handle } = useLocalSearchParams<{ handle?: string }>();
  const { openLink, showLinkOptions } = useLinkPress();
  const { _ } = useLingui();
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = useState(handle ?? "");
  const [password, setPassword] = useState("");
  const [hasFocusedPassword, setHasFocusedPassword] = useState(false);

  const login = useMutation({
    mutationKey: ["login"],
    mutationFn: async () => {
      const normalizedIdentifier = identifier.startsWith("@")
        ? identifier.slice(1).trim()
        : identifier.trim();
      await authLogin(normalizedIdentifier, password);
    },
    onSuccess: () => {
      // Dismiss the auth modal and navigate to feeds
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace("/(feeds)/feeds");
    },
    onError: (err) =>
      showToastable({
        title: _(msg`Could not log you in`),
        message: err instanceof Error ? err.message : _(msg`Unknown error`),
        status: "warning",
      }),
  });

  return (
    <>
      <Stack.Screen options={{ headerRight: () => null }} />
      <TransparentHeaderUntilScrolled>
        <KeyboardAwareScrollView
          contentInsetAdjustmentBehavior="automatic"
          className="flex-1"
          contentContainerStyle={{ padding: 16, gap: 16 }}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <View className="justify-stretch">
            <View
              className="mb-1 flex-row items-center rounded-b-sm rounded-t-lg pl-3"
              style={{ backgroundColor: theme.colors.card }}
            >
              <UserIcon size={18} color="rgb(163 163 163)" />
              <TextInput
                className="flex-1 flex-row items-center px-2 py-3 text-base leading-5"
                placeholder={_(msg`Username or email address`)}
                value={identifier}
                onChangeText={setIdentifier}
                autoCapitalize="none"
                onBlur={() => {
                  let fixed = identifier;
                  if (identifier.startsWith("@")) fixed = identifier.slice(1);
                  if (!identifier.includes(".") && identifier.length > 0)
                    fixed = `${fixed}.bsky.social`;
                  setIdentifier(fixed);
                }}
                autoFocus={!handle}
              />
            </View>
            <View
              className="flex-row items-center rounded-b-lg rounded-t-sm pl-3"
              style={{ backgroundColor: theme.colors.card }}
            >
              <LockIcon size={18} color="rgb(163 163 163)" />
              <TextInput
                className="flex-1 flex-row items-center px-2 py-3 text-base leading-5"
                placeholder={_(msg`App Password`)}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                onFocus={() => setHasFocusedPassword(true)}
                autoFocus={!!handle}
              />
              <TextButton
                onPress={() => {
                  if (z.string().email().safeParse(identifier).success) {
                    router.push("/reset-password?email=" + identifier);
                  } else {
                    router.push("/reset-password");
                  }
                }}
                title={_(msg`Forgot?`)}
                className="pr-3 text-sm"
              />
            </View>
          </View>
          {hasFocusedPassword && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              className="flex-row rounded border-blue-500 bg-blue-50 p-3 pb-4 dark:bg-blue-950"
              style={{ borderWidth: StyleSheet.hairlineWidth }}
            >
              <ShieldAlertIcon
                size={18}
                className="mt-px"
                color={theme.colors.text}
              />
              <View className="ml-3 flex-1">
                <Text className="text-base font-medium leading-5">
                  <Trans>App Passwords</Trans>
                </Text>
                <Text className="mt-1">
                  <Trans>
                    You might want to use an App Password rather than your main
                    password - this helps keep your account secure, but it{"'"}s
                    not required.
                  </Trans>
                </Text>
                <Text
                  className="mt-2"
                  primary
                  accessibilityRole="link"
                  onPress={() =>
                    openLink("https://bsky.app/settings/app-passwords")
                  }
                  onLongPress={() =>
                    showLinkOptions("https://bsky.app/settings/app-passwords")
                  }
                >
                  <Trans>Create one at bsky.app/settings</Trans>
                </Text>
              </View>
            </Animated.View>
          )}
        </KeyboardAwareScrollView>
      </TransparentHeaderUntilScrolled>
      <KeyboardStickyView
        className="px-4"
        offset={{ closed: insets.bottom * -1, opened: 16 * -1 }}
      >
        <Button
          disabled={!identifier || !password || login.isPending}
          onPress={() => login.mutate()}
        >
          <Trans>Log in</Trans>
        </Button>
      </KeyboardStickyView>
    </>
  );
}
