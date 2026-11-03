import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
} from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { showToastable } from "react-native-toastable";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { AtSignIcon, ShieldCheckIcon } from "lucide-react-native";

import { Button } from "~/components/button";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAuth } from "~/lib/agent";

/** the PDS that hosts sign up for new bluesky accounts */
const SIGN_UP_PDS = "https://bsky.social";

/**
 * tidy up what the user typed. handles get the leading @ removed and
 * `.bsky.social` added if there's no domain. dids and PDS urls are left as is
 */
function normalizeIdentifier(input: string) {
  let identifier = input.trim();
  if (identifier.startsWith("@")) identifier = identifier.slice(1);
  if (
    identifier.length > 0 &&
    !identifier.includes(".") &&
    !identifier.includes(":")
  ) {
    identifier = `${identifier}.bsky.social`;
  }
  return identifier;
}

export default function SignIn() {
  const { signIn } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { handle } = useLocalSearchParams<{ handle?: string }>();
  const { _ } = useLingui();
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = useState(handle ?? "");

  const login = useMutation({
    mutationKey: ["login"],
    mutationFn: async (variables: { input: string; create?: boolean }) => {
      return await signIn(variables.input, { create: variables.create });
    },
    onSuccess: (signedIn) => {
      // they closed the browser - let them try again
      if (!signedIn) return;
      // Dismiss the auth modal and navigate to feeds
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace("/(feeds)/feeds");
    },
    onError: (err) => {
      console.error(err);
      showToastable({
        title: _(msg`Could not log you in`),
        message: err instanceof Error ? err.message : _(msg`Unknown error`),
        status: "warning",
      });
    },
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
          <View
            className="flex-row items-center rounded-lg pl-3"
            style={{ backgroundColor: theme.colors.card }}
          >
            <AtSignIcon size={18} color="rgb(163 163 163)" />
            <TextInput
              className="flex-1 flex-row items-center px-2 py-3 text-base leading-5"
              placeholder={_(msg`Handle, e.g. alice.bsky.social`)}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username"
              textContentType="username"
              keyboardType="url"
              returnKeyType="go"
              onBlur={() => setIdentifier(normalizeIdentifier(identifier))}
              onSubmitEditing={() => {
                const input = normalizeIdentifier(identifier);
                if (input && !login.isPending) login.mutate({ input });
              }}
              autoFocus={!handle}
            />
          </View>
          <View
            className="flex-row rounded border-blue-500 bg-blue-50 p-3 pb-4 dark:bg-blue-950"
            style={{ borderWidth: StyleSheet.hairlineWidth }}
          >
            <ShieldCheckIcon
              size={18}
              className="mt-px"
              color={theme.colors.text}
            />
            <View className="ml-3 flex-1">
              <Text className="text-base font-medium leading-5">
                <Trans>Sign in with your Bluesky account</Trans>
              </Text>
              <Text className="mt-1">
                <Trans>
                  You{"'"}ll be taken to your account provider to sign in, so
                  Graysky never sees your password. If you host your own
                  account, you can enter your PDS address instead.
                </Trans>
              </Text>
            </View>
          </View>
          {/* not a link nested in the sentence - presses on nested text
              didn't register */}
          <View className="flex-row flex-wrap items-center justify-center">
            <Text className="text-neutral-500">
              <Trans>Don{"'"}t have an account?</Trans>{" "}
            </Text>
            <TouchableOpacity
              accessibilityRole="link"
              hitSlop={12}
              disabled={login.isPending}
              onPress={() => login.mutate({ input: SIGN_UP_PDS, create: true })}
            >
              <Text primary className="font-medium">
                <Trans>Create one</Trans>
              </Text>
            </TouchableOpacity>
          </View>
        </KeyboardAwareScrollView>
      </TransparentHeaderUntilScrolled>
      <KeyboardStickyView
        className="px-4"
        offset={{ closed: insets.bottom * -1, opened: 16 * -1 }}
      >
        <Button
          disabled={!identifier.trim() || login.isPending}
          onPress={() =>
            login.mutate({ input: normalizeIdentifier(identifier) })
          }
        >
          <Trans>Continue</Trans>
        </Button>
      </KeyboardStickyView>
    </>
  );
}
