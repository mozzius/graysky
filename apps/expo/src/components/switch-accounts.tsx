import { Fragment } from "react";
import {
  ActivityIndicator,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { showToastable } from "react-native-toastable";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { type AtpSessionData } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRightIcon, PlusIcon } from "lucide-react-native";

import { ItemSeparator } from "~/components/item-separator";
import { Text } from "~/components/themed/text";
import { useAgent } from "~/lib/agent";
import { useLogOut } from "~/lib/log-out-context";
import { cx } from "~/lib/utils/cx";

export interface SavedSession {
  displayName?: string;
  avatar?: string;
  handle: string;
  did: string;
  session: AtpSessionData;
  signedOut?: boolean;
}
interface Props {
  sessions: SavedSession[];
  active?: string;
  onSuccessfulSwitch?: () => void;
  chevrons?: boolean;
  showAddAccount?: boolean;
}

export function SwitchAccounts({
  sessions,
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

  const resume = useMutation({
    mutationKey: ["switch-accounts"],
    mutationFn: async (session: AtpSessionData) => {
      // HACKFIX - service url gets changed after authenication
      // https://github.com/bluesky-social/atproto/issues/1964
      agent.api.xrpc.uri = new URL("https://bsky.social");
      const res = await agent.resumeSession(session);
      if (!res.success) throw new Error("Could not resume session");
      await queryClient.resetQueries();
      return res.data;
    },
    onError: (err, session) => {
      console.error(err);
      showToastable({
        title: "Could not log you in",
        message: err instanceof Error ? err.message : "Unknown error",
        status: "warning",
      });
      router.push(`/sign-in?handle=${session.handle}`);
    },
    onSuccess: (data) => {
      showToastable({
        title: "Logged in",
        message: `You are now logged in as @${data.handle}`,
        status: "success",
      });
      router.replace("/(feeds)/feeds");
      onSuccessfulSwitch?.();
    },
  });

  return (
    <View
      style={{ backgroundColor: theme.colors.card }}
      className="flex-1 overflow-hidden rounded-lg"
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
                <Image
                  source={{ uri: account.avatar }}
                  className="h-10 w-10 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-700"
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
                    <Text
                      style={{ color: theme.colors.primary }}
                      className="font-medium"
                    >
                      Sign out
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
                <Text>Add another account</Text>
              </View>
            </View>
          </TouchableHighlight>
        </Link>
      )}
    </View>
  );
}
