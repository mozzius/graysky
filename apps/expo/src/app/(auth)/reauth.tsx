import { useEffect, useState } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";

import { Avatar } from "~/components/avatar";
import { Button } from "~/components/button";
import { TextButton } from "~/components/text-button";
import { Text } from "~/components/themed/text";
import { useAuth } from "~/lib/agent";
import { clearReauthDid, getSavedSessions } from "~/lib/session";

/**
 * shown once, on the first launch after the switch from passwords to oauth,
 * to whoever was signed in at the time
 */
export default function Reauth() {
  const { did } = useLocalSearchParams<{ did?: string }>();
  const { signIn } = useAuth();
  const router = useRouter();
  const { _ } = useLingui();
  const insets = useSafeAreaInsets();

  const [account] = useState(() =>
    getSavedSessions().find((s) => s.did === did),
  );

  // only show this once
  useEffect(() => {
    clearReauthDid();
  }, []);

  const login = useMutation({
    mutationKey: ["login"],
    mutationFn: async () => {
      if (!account) throw new Error("Account not found");
      return await signIn(account.handle);
    },
    onSuccess: (signedIn) => {
      if (!signedIn) return;
      if (router.canDismiss()) {
        router.dismissAll();
      }
      router.replace("/(feeds)/feeds");
    },
    onError: (err) => {
      console.error(err);
      toast.warning(_(msg`Could not log you in`), {
        description: err instanceof Error ? err.message : _(msg`Unknown error`),
      });
    },
  });

  return (
    <>
      <Stack.Screen options={{ headerRight: () => null }} />
      <View
        className="flex-1 justify-between px-4 pt-8"
        style={{ paddingBottom: insets.bottom + 16 }}
      >
        <View className="items-center">
          {account && (
            <Avatar
              uri={account.avatar}
              alt={account.displayName ?? `@${account.handle}`}
              size="extraLarge"
            />
          )}
          <Text className="mt-4 text-center text-2xl font-semibold">
            <Trans>Please sign in again</Trans>
          </Text>
          <Text className="mt-3 text-center text-base">
            <Trans>
              Graysky now signs in through your account provider, so your
              password never touches the app. You{"'"}ll need to sign in once
              more - your accounts and settings are all still here.
            </Trans>
          </Text>
        </View>
        <View className="gap-2">
          {account && (
            <Button disabled={login.isPending} onPress={() => login.mutate()}>
              <Trans>Continue as @{account.handle}</Trans>
            </Button>
          )}
          <View className="items-center py-2">
            <TextButton
              title={_(msg`Use a different account`)}
              disabled={login.isPending}
              onPress={() => router.replace("/sign-in")}
            />
          </View>
        </View>
      </View>
    </>
  );
}
