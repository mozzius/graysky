import { ActivityIndicator, Switch } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";

import { GroupedList } from "~/components/grouped-list";
import { QueryWithoutData } from "~/components/query-without-data";
import { useAgent } from "~/lib/agent";
import { usePreferences } from "~/lib/hooks/preferences";
import { produce } from "~/lib/utils/produce";

const defaultFeedViewPref = {
  hideReplies: false,
  hideRepliesByUnfollowed: true,
  hideRepliesByLikeCount: 2,
  hideReposts: false,
  hideQuotePosts: false,
  $type: "app.bsky.actor.defs#feedViewPref",
  feed: "home",
} as AppBskyActorDefs.FeedViewPref;

export const getFeedViewPref = (preferences?: AppBskyActorDefs.Preferences) => {
  if (!preferences) return defaultFeedViewPref;

  const feedViewPref =
    (preferences.find(
      (x) => AppBskyActorDefs.isFeedViewPref(x) && x.feed === "home",
    ) as AppBskyActorDefs.FeedViewPref | undefined) ?? defaultFeedViewPref;

  return feedViewPref;
};

export default function FeedPreferences() {
  const agent = useAgent();

  const preferences = usePreferences();

  const setPreference = useMutation({
    mutationFn: async (
      feedViewPref: Omit<AppBskyActorDefs.FeedViewPref, "feed">,
    ) => {
      if (!preferences.data) throw new Error("No preferences");

      await agent.app.bsky.actor.putPreferences({
        preferences: produce(preferences.data, (draft) => {
          const index = draft.findIndex(
            (x) => AppBskyActorDefs.isFeedViewPref(x) && x.feed === "home",
          );
          if (index === -1) {
            draft.push({
              ...defaultFeedViewPref,
              ...feedViewPref,
            });
          } else {
            draft[index] = {
              ...draft[index],
              ...feedViewPref,
            };
          }
        }),
      });
    },
    onSettled: () => preferences.refetch(),
  });

  if (preferences.data) {
    const feedViewPref = getFeedViewPref(preferences.data);

    return (
      <GroupedList
        groups={[
          {
            title: "Reply settings",
            options: [
              {
                title: "Show replies",
                action: (
                  <LoadingValue query={setPreference} property="hideReplies">
                    <Switch
                      disabled={setPreference.isLoading}
                      value={!feedViewPref.hideReplies}
                      onValueChange={(value) => {
                        setPreference.mutate({
                          hideReplies: !value,
                        });
                      }}
                    />
                  </LoadingValue>
                ),
              },
              {
                title: "Only show replies from your follows",
                action: (
                  <LoadingValue
                    query={setPreference}
                    property="hideRepliesByUnfollowed"
                  >
                    <Switch
                      disabled={
                        setPreference.isLoading || feedViewPref.hideReplies
                      }
                      value={!feedViewPref.hideRepliesByUnfollowed}
                      onValueChange={(value) => {
                        setPreference.mutate({
                          hideRepliesByUnfollowed: !value,
                        });
                      }}
                    />
                  </LoadingValue>
                ),
                disabled: feedViewPref.hideReplies,
              },
            ],
          },
          {
            title: "Repost settings",
            options: [
              {
                title: "Show reposts",
                action: (
                  <LoadingValue query={setPreference} property="hideReposts">
                    <Switch
                      disabled={setPreference.isLoading}
                      value={!feedViewPref.hideReposts}
                      onValueChange={(value) => {
                        setPreference.mutate({
                          hideReposts: !value,
                        });
                      }}
                    />
                  </LoadingValue>
                ),
              },
            ],
          },
          {
            title: "Quote post settings",
            options: [
              {
                title: "Show quote posts",
                action: (
                  <LoadingValue query={setPreference} property="hideQuotePosts">
                    <Switch
                      disabled={setPreference.isLoading}
                      value={!feedViewPref.hideQuotePosts}
                      onValueChange={(value) => {
                        setPreference.mutate({
                          hideQuotePosts: !value,
                        });
                      }}
                    />
                  </LoadingValue>
                ),
              },
            ],
          },
        ]}
      />
    );
  }

  return <QueryWithoutData query={preferences} />;
}

const LoadingValue = ({
  children,
  property,
  query,
}: {
  children: React.ReactNode;
  property: keyof Pick<
    AppBskyActorDefs.FeedViewPref,
    | "hideReplies"
    | "hideRepliesByUnfollowed"
    | "hideRepliesByLikeCount"
    | "hideReposts"
    | "hideQuotePosts"
  >;
  query: UseMutationResult<
    void,
    unknown,
    Omit<AppBskyActorDefs.FeedViewPref, "feed">,
    unknown
  >;
}) => {
  if (
    query.isLoading &&
    property in (query.variables as AppBskyActorDefs.FeedViewPref)
  ) {
    return <ActivityIndicator />;
  }
  return <>{children}</>;
};
