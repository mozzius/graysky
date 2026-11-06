import { Fragment } from "react";
import {
  ActivityIndicator,
  Alert,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { useMMKVObject } from "react-native-mmkv";
import { Link, useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";
import { ChevronRightIcon, PlusIcon } from "lucide-react-native";
import { toast } from "sonner-native";

import { type FormRows } from "~/components/form";
import { ItemSeparator } from "~/components/item-separator";
import { Text } from "~/components/themed/text";
import { useAuth } from "~/lib/agent";
import { getOAuthClient, isSessionGoneError } from "~/lib/oauth";
import { removeSavedSession, type SavedSession } from "~/lib/session";
import { store } from "~/lib/storage/storage";
import { cx } from "~/lib/utils/cx";
import { Avatar } from "./avatar";

export type { SavedSession };

interface Options {
  active?: string;
  onSuccessfulSwitch?: () => void;
}

/** the saved accounts, and switching between, removing and signing out of them */
export function useSwitchAccounts({ active, onSuccessfulSwitch }: Options) {
  const { signIn, switchAccount, logout } = useAuth();
  const router = useRouter();
  const { _ } = useLingui();

  const [savedSessions = []] = useMMKVObject<SavedSession[]>("sessions", store);
  // active account first
  const sessions = [...savedSessions].sort(
    (a, b) => Number(b.did === active) - Number(a.did === active),
  );

  const resume = useMutation({
    mutationKey: ["switch-accounts"],
    // resolves false if they backed out of the browser sheet
    mutationFn: async (account: SavedSession) => {
      if (!account.signedOut) {
        try {
          // restores the stored oauth session for this account
          await switchAccount(account.did);
          return true;
        } catch (err) {
          if (!isSessionGoneError(err)) throw err;
        }
      }
      // needs to go through oauth again
      return await signIn(account.handle);
    },
    onError: (err) => {
      console.error(err);
      toast.warning(_(msg`Could not log you in`), {
        description: err instanceof Error ? err.message : _(msg`Unknown error`),
      });
    },
    onSuccess: (signedIn, account) => {
      if (!signedIn) return;
      toast.success(_(msg`Logged in`), {
        description: _(msg`You are now logged in as @${account.handle}`),
      });
      router.replace("/(feeds)/feeds");
      onSuccessfulSwitch?.();
    },
  });

  const removeAccount = (account: SavedSession) => {
    Alert.alert(
      _(msg`Remove account?`),
      _(
        msg`@${account.handle} will be removed from this device. You can add it again by signing in.`,
      ),
      [
        { text: _(msg`Cancel`), style: "cancel" },
        {
          text: _(msg`Remove`),
          style: "destructive",
          onPress: () => {
            removeSavedSession(account.did);
            // like signing out - revoke the tokens and delete the stored
            // session, if there is one
            getOAuthClient()
              .revoke(account.did)
              .catch((err: unknown) => {
                console.warn("failed to revoke session", err);
              });
          },
        },
      ],
    );
  };

  const signOut = () => {
    router.push("../");
    logout();
  };

  const isSwitchingTo = (account: SavedSession) =>
    resume.isPending && resume.variables?.did === account.did;

  return { sessions, resume, removeAccount, signOut, isSwitchingTo };
}

/**
 * The saved accounts as form rows: one per account, then sign out (if
 * there's an `active` account) and add account
 */
export function useAccountRows({
  active,
  chevrons,
  showAddAccount,
}: {
  active?: string;
  /** on non-active accounts. iOS only */
  chevrons?: boolean;
  showAddAccount?: boolean;
}): FormRows {
  const { sessions, resume, removeAccount, signOut, isSwitchingTo } =
    useSwitchAccounts({ active });
  const { _ } = useLingui();

  return [
    ...sessions.map((account) => {
      const isActive = account.did === active;
      const handle = `@${account.handle}`;
      return {
        key: account.did,
        title: account.displayName ?? handle,
        subtitle:
          account.signedOut && !isActive
            ? _(msg`Tap to sign in again`)
            : account.displayName
              ? handle
              : undefined,
        leading: (
          <Avatar
            uri={account.avatar}
            alt={account.displayName ?? handle}
            size="medium"
          />
        ),
        // pressing the active account signs out of it
        ...(isActive && {
          onPress: signOut,
          value: _(msg`Sign out`),
          valueTone: "primary" as const,
          disabled: resume.isPending,
        }),
        ...(!isActive && {
          onPress: () => resume.mutate(account),
          disabled: resume.isPending,
          chevron: chevrons,
          accessory: isSwitchingTo(account) ? ("loading" as const) : undefined,
          longPress: {
            label: _(msg`Remove`),
            destructive: true,
            onPress: () => removeAccount(account),
          },
        }),
      };
    }),
    showAddAccount && {
      key: "add-account",
      title: _(msg`Add another account`),
      href: "/sign-in",
      leading: <AddAccountIcon />,
      disabled: resume.isPending,
    },
  ];
}

// the same size as an avatar, so the titles line up
function AddAccountIcon() {
  return (
    <View className="h-10 w-10 items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700">
      <PlusIcon size={24} className="text-neutral-500 dark:text-neutral-300" />
    </View>
  );
}

interface Props extends Options {
  chevrons?: boolean;
  showAddAccount?: boolean;
}

/** the RN version, for outside a form (the account switcher sheet) */
export function SwitchAccounts({
  active,
  onSuccessfulSwitch,
  chevrons,
  showAddAccount,
}: Props) {
  const theme = useTheme();
  const { sessions, resume, removeAccount, signOut, isSwitchingTo } =
    useSwitchAccounts({ active, onSuccessfulSwitch });

  return (
    <View
      style={{ backgroundColor: theme.colors.card }}
      className="flex-1 overflow-hidden rounded-2xl"
    >
      {sessions.map((account) => {
        const isActive = account.did === active;
        const content = (
          <View
            className="flex-row items-center px-4 py-2"
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
              {account.signedOut && !isActive && (
                <Text className="text-xs text-neutral-500">
                  <Trans>Tap to sign in again</Trans>
                </Text>
              )}
            </View>
            {isSwitchingTo(account) ? (
              <ActivityIndicator />
            ) : isActive ? (
              <TouchableOpacity onPress={signOut}>
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
        );

        return (
          <Fragment key={account.did}>
            <TouchableHighlight
              className={cx(resume.isPending && "opacity-50")}
              onPress={() => resume.mutate(account)}
              // long press to remove. not a menu button inside the row -
              // pressing that also triggered the row's onPress
              onLongPress={isActive ? undefined : () => removeAccount(account)}
              disabled={resume.isPending || isActive}
            >
              {content}
            </TouchableHighlight>
            <ItemSeparator iconWidth="w-10" />
          </Fragment>
        );
      })}
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
