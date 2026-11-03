import { useCallback } from "react";
import { ActivityIndicator, Platform, TouchableOpacity } from "react-native";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import {
  currentDatetimeString,
  type AtIdentifierString,
  type AtUriString,
  type DidString,
} from "@atproto/lex";
import { AtUri } from "@atproto/syntax";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ListPlusIcon, PlusIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { QueryWithoutData } from "~/components/query-without-data";
import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { isIOS26 } from "~/lib/utils/version";

export default function AddToListScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const agent = useAgent();
  const theme = useTheme();
  const { _ } = useLingui();

  const profile = useQuery({
    queryKey: ["profile", handle],
    queryFn: async () => {
      if (!handle) throw new Error("No DID provided");
      return await agent.call(app.bsky.actor.getProfile, {
        actor: handle as AtIdentifierString,
      });
    },
  });

  const lists = useQuery({
    queryKey: [agent.did, "lists"],
    queryFn: async () => {
      if (!agent.did) return null;
      return await agent.call(app.bsky.graph.getLists, {
        actor: agent.did,
      });
    },
  });

  const members = useDangerousListMembershipsQuery();

  const headerRight = useCallback(
    () =>
      Platform.select({
        ios: (
          <TouchableOpacity onPress={() => router.push("../")}>
            <Text primary className="text-lg font-medium">
              <Trans>Done</Trans>
            </Text>
          </TouchableOpacity>
        ),
      }),
    [router],
  );

  const { mutate: addToList } = useListMembershipAddMutation();
  const { mutate: removeFromList } = useListMembershipRemoveMutation();

  const renderList = useCallback(
    (list: app.bsky.graph.defs.ListView) => ({
      title: list.name,
      onPress: () => {
        const membership = getMembership(
          members.data,
          list.uri,
          profile.data?.did,
        );
        if (membership) {
          removeFromList({
            membershipUri: membership,
            actorDid: (profile.data?.did ?? "") as DidString,
            listUri: list.uri,
          });
        } else {
          addToList({
            listUri: list.uri,
            actorDid: (profile.data?.did ?? "") as DidString,
          });
        }
      },
      action: members.data ? (
        getMembership(members.data, list.uri, profile.data?.did) ? (
          <CheckIcon size={24} color={theme.colors.primary} />
        ) : (
          <PlusIcon size={24} color={theme.colors.primary} />
        )
      ) : (
        <ActivityIndicator size="small" />
      ),
    }),
    [
      members.data,
      profile.data?.did,
      theme.colors.primary,
      removeFromList,
      addToList,
    ],
  );

  if (!handle) return <Redirect href="../" />;

  if (profile.data) {
    const moderationLists = lists.data?.lists.filter(
      (list) => list.purpose === "app.bsky.graph.defs#modlist",
    );
    const userLists = lists.data?.lists.filter(
      (list) => list.purpose === "app.bsky.graph.defs#curatelist",
    );

    return (
      <>
        <StatusBar modal />
        <Stack.Screen
          options={{
            title: _(
              msg`Add ${
                profile.data.displayName ?? `@${profile.data.handle}`
              } to List`,
            ),
            ...(isIOS26
              ? {
                  unstable_headerRightItems: () => [
                    {
                      type: "button",
                      onPress: () => router.dismiss(),
                      label: _(msg`Close`),
                      icon: { type: "sfSymbol", name: "xmark" },
                    },
                  ],
                }
              : { headerRight }),
          }}
        />
        <TransparentHeaderUntilScrolled>
          <GroupedList
            groups={[
              {
                title: _(msg`Add to user list`),
                options: userLists?.map(renderList),
                children: userLists?.length === 0 && (
                  <Text className="my-3 text-center text-base text-neutral-500">
                    You don{"'"}t have any user lists yet.
                  </Text>
                ),
              },
              {
                title: _(msg`Add to moderation list`),
                options: moderationLists?.map(renderList),
                children: moderationLists?.length === 0 && (
                  <Text className="my-3 text-center text-base text-neutral-500">
                    <Trans>You don{"'"}t have any moderation lists yet.</Trans>
                  </Text>
                ),
              },
              {
                title: _(msg`Need a new list?`),
                options: [
                  {
                    icon: ListPlusIcon,
                    title: _(msg`Create new list`),
                    href: "/create-list",
                  },
                ],
              },
            ]}
          />
        </TransparentHeaderUntilScrolled>
      </>
    );
  }

  return <QueryWithoutData query={profile} />;
}

// no api for checking list membership so get them all
// this is terrible and I don't want to write it out myself, so I'm just going to copy it from social-app
// https://github.com/bluesky-social/social-app/blob/4f2802856986e648052d5c5f04c6fcf50e0a731e/src/state/queries/list-memberships.ts#L151

// sanity limit is SANITY_PAGE_LIMIT*PAGE_SIZE total records
const SANITY_PAGE_LIMIT = 1000;
const PAGE_SIZE = 100;
// ...which comes 100,000k list members

export const RQKEY = () => ["list-memberships"];

export interface ListMembership {
  membershipUri: string;
  listUri: AtUriString;
  actorDid: DidString;
}

/**
 * This API is dangerous! Read the note above!
 */
export function useDangerousListMembershipsQuery() {
  const agent = useAgent();
  return useQuery<ListMembership[]>({
    queryKey: ["list-membership", agent.did],
    async queryFn() {
      if (!agent.did) {
        return [];
      }
      let cursor: string | undefined;
      let arr: ListMembership[] = [];
      for (let i = 0; i < SANITY_PAGE_LIMIT; i++) {
        const res = await agent.list(app.bsky.graph.listitem, {
          repo: agent.did,
          limit: PAGE_SIZE,
          cursor,
        });
        arr = arr.concat(
          res.records
            .filter((r): r is Extract<typeof r, { valid: true }> => r.valid)
            .map((r) => ({
              membershipUri: r.uri,
              listUri: r.value.list,
              actorDid: r.value.subject,
            })),
        );
        cursor = res.cursor;
        if (!cursor) {
          break;
        }
      }
      return arr;
    },
  });
}

/**
 * Returns undefined for pending, false for not a member, and string for a member (the URI of the membership record)
 */
export function getMembership(
  memberships: ListMembership[] | undefined,
  list: string,
  actor: string | undefined,
): string | false | undefined {
  if (!memberships || !actor) {
    return undefined;
  }
  const membership = memberships.find(
    (m) => m.listUri === list && m.actorDid === actor,
  );
  return membership ? membership.membershipUri : false;
}

export function useListMembershipAddMutation() {
  const agent = useAgent();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listUri,
      actorDid,
    }: Pick<ListMembership, "actorDid" | "listUri">) => {
      if (!agent.did) throw new Error("Not logged in");
      return await agent.create(app.bsky.graph.listitem, {
        subject: actorDid,
        list: listUri,
        createdAt: currentDatetimeString(),
      });
    },
    onSuccess(data, variables) {
      // manually update the cache; a refetch is too expensive
      let memberships = queryClient.getQueryData<ListMembership[]>([
        "list-membership",
        agent.did,
      ]);
      if (memberships) {
        memberships = memberships
          // avoid dups
          .filter(
            (m) =>
              !(
                m.actorDid === variables.actorDid &&
                m.listUri === variables.listUri
              ),
          )
          .concat([
            {
              ...variables,
              membershipUri: data.uri,
            },
          ]);
        queryClient.setQueryData(["list-membership", agent.did], memberships);
      }
    },
  });
}

export function useListMembershipRemoveMutation() {
  const agent = useAgent();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ membershipUri }: ListMembership) => {
      if (!agent.did) throw new Error("Not logged in");
      await agent.delete(app.bsky.graph.listitem, {
        rkey: new AtUri(membershipUri).rkey,
      });
    },
    onSuccess(data, variables) {
      // manually update the cache; a refetch is too expensive
      let memberships = queryClient.getQueryData<ListMembership[]>([
        "list-membership",
        agent.did,
      ]);
      if (memberships) {
        memberships = memberships.filter(
          (m) =>
            !(
              m.actorDid === variables.actorDid &&
              m.listUri === variables.listUri
            ),
        );
        queryClient.setQueryData(["list-membership", agent.did], memberships);
      }
    },
  });
}
