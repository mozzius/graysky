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
import { type AtpSessionData } from "@atproto/api";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, PlusIcon } from "lucide-react-native";

import { ItemSeparator } from "~/components/item-separator";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useLogOut } from "~/lib/log-out-context";
import { store } from "~/lib/storage/storage";
import { cx } from "~/lib/utils/cx";
import { Avatar } from "./avatar";

export interface SavedSession {
  displayName?: string;
  avatar?: string;
  handle: string;
  did: string;
  session: AtpSessionData;
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
  const agent = useAgent();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const logOut = useLogOut();
  const router = useRouter();
  const { _ } = useLingui();

  const [sessions = []] = useMMKVObject<SavedSession[]>("sessions", store);

  const resume = useMutation({
    mutationKey: ["switch-accounts"],
    mutationFn: async (session: AtpSessionData) => {
      // HACKFIX - service url gets changed after authenication
      // reset service URL and pdsUrl when resuming
      // https://github.com/bluesky-social/atproto/issues/1964
      agent.pdsUrl = undefined;
      agent.api.xrpc.uri = new URL("https://bsky.social");
      const res = await agent.resumeSession(session);
      if (!res.success) throw new Error("Could not resume session");
      return res.data;
    },
    onError: (err, session) => {
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
      router.push(`/sign-in?handle=${session.handle}`);
    },
    onSuccess: (data) => {
      showToastable({
        title: _(msg`Logged in`),
        message: _(msg`You are now logged in as @${data.handle}`),
        status: "success",
      });
      void queryClient.resetQueries();
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
                  resume.mutate(account.session);
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
                      logOut();
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
