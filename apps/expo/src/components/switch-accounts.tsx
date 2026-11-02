import { Fragment } from "react";
import {
  ActivityIndicator,
  Alert,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { useMMKVObject } from "react-native-mmkv";
import { showToastable } from "react-native-toastable";
import { Link, useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { type AtpSessionData } from "@atproto/api";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, PlusIcon } from "lucide-react-native";

import { ItemSeparator } from "~/components/item-separator";
import { Text } from "~/components/themed/text";
import { useAuth } from "~/lib/agent";
import { store } from "~/lib/storage/storage";
import { cx } from "~/lib/utils/cx";
import { Avatar } from "./avatar";

export interface SavedSession {
  displayName?: string;
  avatar?: string;
  handle: string;
  did: string;
  session: AtpSessionData;
  pdsUrl?: string;
  signedOut?: boolean;
}
interface Props {
  active?: string;
  onSuccessfulSwitch?: () => void;
  chevrons?: boolean;
  showAddAccount?: boolean;
}

export function SwitchAccounts({
  active,
  onSuccessfulSwitch,
  chevrons,
  showAddAccount,
}: Props) {
  const { resumeSession, logout } = useAuth();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { _ } = useLingui();

  const [sessions = []] = useMMKVObject<SavedSession[]>("sessions", store);

  const resume = useMutation({
    mutationKey: ["switch-accounts"],
    mutationFn: async (account: SavedSession) => {
      // Clear all cached data from the previous account
      queryClient.clear();
      // Creates a fresh agent for the new session
      await resumeSession(account.session, account.pdsUrl);
      return account.session;
    },
    onError: (err, account) => {
      Alert.alert(
        _(msg`Could not log you in`),
        err instanceof Error ? err.message : _(msg`Unknown error`),
      );
      console.error(err);
      showToastable({
        title: _(msg`Could not log you in`),
        message: err instanceof Error ? err.message : _(msg`Unknown error`),
        status: "warning",
      });
      router.push(`/sign-in?handle=${account.handle}`);
    },
    onSuccess: (session) => {
      showToastable({
        title: _(msg`Logged in`),
        message: _(msg`You are now logged in as @${session.handle}`),
        status: "success",
      });
      router.replace("/(feeds)/feeds");
      onSuccessfulSwitch?.();
    },
  });

  return (
    <View
      style={{ backgroundColor: theme.colors.card }}
      className="flex-1 overflow-hidden rounded-2xl"
    >
      {sessions
        .sort((a) => {
          // move active account to top
          if (a.did === active) return -1;
          return 0;
        })
        .map((account) => (
          <Fragment key={account.did}>
            <TouchableHighlight
              className={cx("flex-1", resume.isPending && "opacity-50")}
              onPress={() => {
                if (account.signedOut) {
                  router.push(`/sign-in?handle=${account.handle}`);
                } else {
                  resume.mutate(account);
                }
              }}
              disabled={resume.isPending || account.did === active}
            >
              <View
                className="flex-1 flex-row items-center px-4 py-2"
                style={{ backgroundColor: theme.colors.card }}
              >
                <Avatar
                  uri={account.avatar}
                  alt={account.displayName ?? `@${account.handle}`}
                  className="shrink-0"
                  size="medium"
                />
                <View className="ml-3 flex-1">
                  {account.displayName && (
                    <Text className="text-base font-medium">
                      {account.displayName}
                    </Text>
                  )}
                  <Text className="text-neutral-500">@{account.handle}</Text>
                </View>
                {resume.isPending && resume.variables?.did === account.did ? (
                  <ActivityIndicator />
                ) : account.did === active ? (
                  <TouchableOpacity
                    onPress={() => {
                      router.push("../");
                      logout();
                    }}
                  >
                    <Text primary className="font-medium">
                      <Trans>Sign out</Trans>
                    </Text>
                  </TouchableOpacity>
                ) : (
                  chevrons && (
                    <ChevronRightIcon size={16} className="text-neutral-500" />
                  )
                )}
              </View>
            </TouchableHighlight>
            <ItemSeparator iconWidth="w-10" />
          </Fragment>
        ))}
      {showAddAccount && (
        <Link href="/sign-in" asChild>
          <TouchableHighlight
            className={cx("flex-1", resume.isPending && "opacity-50")}
            disabled={resume.isPending}
          >
            <View
              className="flex-1 flex-row items-center px-4 py-2"
              style={{ backgroundColor: theme.colors.card }}
            >
              <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
                <PlusIcon
                  size={24}
                  className="text-neutral-500 dark:text-neutral-300"
                />
              </View>
              <View className="ml-3 flex-1">
                <Text>
                  <Trans>Add another account</Trans>
                </Text>
              </View>
            </View>
          </TouchableHighlight>
        </Link>
      )}
    </View>
  );
}
