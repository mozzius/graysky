import { useCallback } from "react";
import { ActivityIndicator, Platform, TouchableOpacity } from "react-native";
import { Redirect, Stack, useLocalSearchParams, useRouter } from "expo-router";
import { type AppBskyGraphDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckIcon, ListPlusIcon, PlusIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { QueryWithoutData } from "~/components/query-without-data";
import { StatusBar } from "~/components/status-bar";
import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";

export default function AddToListScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const agent = useAgent();
  const theme = useTheme();

  const profile = useQuery({
    queryKey: ["profile", handle],
    queryFn: async () => {
      if (!handle) throw new Error("No DID provided");
      const user = await agent.getProfile({ actor: handle });
      if (!user.success) throw new Error("ユーザーの取得ができませんでした");
      return user.data;
    },
  });

  const lists = useQuery({
    queryKey: [agent.session?.did, "lists"],
    queryFn: async () => {
      if (!agent.session) return null;
      const lists = await agent.app.bsky.graph.getLists({
        actor: agent.session.did,
      });
      if (!lists.success) throw new Error("リストの取得ができませんでした");
      return lists.data;
    },
  });

  const members = useDangerousListMembershipsQuery();

  const headerRight = useCallback(
    () =>
      Platform.select({
        ios: (
          <TouchableOpacity onPress={() => router.push("../")}>
            <Text primary className="text-lg font-medium">
              Done
            </Text>
          </TouchableOpacity>
        ),
      }),
    [router],
  );

  const { mutate: addToList } = useListMembershipAddMutation();
  const { mutate: removeFromList } = useListMembershipRemoveMutation();

  const renderList = useCallback(
    (list: AppBskyGraphDefs.ListView) => ({
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
            actorDid: profile.data?.did ?? "",
            listUri: list.uri,
          });
        } else {
          addToList({
            listUri: list.uri,
            actorDid: profile.data?.did ?? "",
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
            headerRight,
            title: `リストに ${
              profile.data.displayName ?? `@${profile.data.handle}`
            } を追加`,
          }}
        />
        <TransparentHeaderUntilScrolled>
          <GroupedList
            groups={[
              {
                title: "ユーザーリストに追加",
                options: userLists?.map(renderList),
                children: userLists?.length === 0 && (
                  <Text className="my-3 text-center text-base text-neutral-500">
                    You don{"'"}t have any user lists yet.
                  </Text>
                ),
              },
              {
                title: "モデレーションリストに追加",
                options: moderationLists?.map(renderList),
                children: moderationLists?.length === 0 && (
                  <Text className="my-3 text-center text-base text-neutral-500">
                    You don{"'"}t have any moderation lists yet.
                  </Text>
                ),
              },
              {
                title: "新規リストが必要ですか?",
                options: [
                  {
                    icon: ListPlusIcon,
                    title: "新規リストを作成",
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
  listUri: string;
  actorDid: string;
}

/**
 * This API is dangerous! Read the note above!
 */
export function useDangerousListMembershipsQuery() {
  const agent = useAgent();
  return useQuery<ListMembership[]>({
    queryKey: ["list-membership", agent.session?.did],
    async queryFn() {
      if (!agent.session?.did) {
        return [];
      }
      let cursor;
      let arr: ListMembership[] = [];
      for (let i = 0; i < SANITY_PAGE_LIMIT; i++) {
        const res = await agent.app.bsky.graph.listitem.list({
          repo: agent.session.did,
          limit: PAGE_SIZE,
          cursor,
        });
        arr = arr.concat(
          res.records.map((r) => ({
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
      if (!agent.session) throw new Error("Not logged in");
      const res = await agent.app.bsky.graph.listitem.create(
        { repo: agent.session.did },
        {
          subject: actorDid,
          list: listUri,
          createdAt: new Date().toISOString(),
        },
      );
      return res;
    },
    onSuccess(data, variables) {
      // manually update the cache; a refetch is too expensive
      let memberships = queryClient.getQueryData<ListMembership[]>([
        "list-membership",
        agent.session?.did,
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
        queryClient.setQueryData(
          ["list-membership", agent.session?.did],
          memberships,
        );
      }
    },
  });
}

export function useListMembershipRemoveMutation() {
  const agent = useAgent();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ membershipUri }: ListMembership) => {
      if (!agent.session) throw new Error("Not logged in");
      await agent.app.bsky.graph.listitem.delete({
        repo: agent.session.did,
        rkey: membershipUri.split("/").pop(),
      });
    },
    onSuccess(data, variables) {
      // manually update the cache; a refetch is too expensive
      let memberships = queryClient.getQueryData<ListMembership[]>([
        "list-membership",
        agent.session?.did,
      ]);
      if (memberships) {
        memberships = memberships.filter(
          (m) =>
            !(
              m.actorDid === variables.actorDid &&
              m.listUri === variables.listUri
            ),
        );
        queryClient.setQueryData(
          ["list-membership", agent.session?.did],
          memberships,
        );
      }
    },
  });
}
