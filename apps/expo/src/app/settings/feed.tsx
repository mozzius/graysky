import { ActivityIndicator, Switch, View } from "react-native";
import { useTheme } from "expo-router/react-navigation";
import { type $Typed } from "@atproto/lex";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { ChevronsUpDownIcon } from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { Menu } from "~/components/menu";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { useSavedFeeds } from "~/lib/hooks";
import { usePreferences } from "~/lib/hooks/preferences";
import {
  useDefaultFeed,
  useHomepage,
  useSetAppPreferences,
} from "~/lib/storage/app-preferences";
import { produce } from "~/lib/utils/produce";
import { isType } from "~/lib/utils/types";

const defaultFeedViewPref = {
  hideReplies: false,
  hideRepliesByUnfollowed: false,
  hideRepliesByLikeCount: 2,
  hideReposts: false,
  hideQuotePosts: false,
  $type: "app.bsky.actor.defs#feedViewPref",
  feed: "home",
} satisfies $Typed<app.bsky.actor.defs.FeedViewPref>;

export const getFeedViewPref = (
  preferences?: app.bsky.actor.defs.Preferences,
) => {
  if (!preferences) return defaultFeedViewPref;

  const feedViewPref =
    (preferences.find(
      (x) => isType(app.bsky.actor.defs.feedViewPref, x) && x.feed === "home",
    ) as app.bsky.actor.defs.FeedViewPref | undefined) ?? defaultFeedViewPref;

  return feedViewPref;
};

export default function FeedPreferences() {
  const agent = useAgent();
  const defaultFeed = useDefaultFeed();
  const homepage = useHomepage();
  const setAppPreferences = useSetAppPreferences();

  const theme = useTheme();
  const savedFeeds = useSavedFeeds();
  const { _ } = useLingui();

  const followingFeedName = _(
    msg({
      id: "following.feed",
      message: "Following",
      comment: "'Following' - The name of the main feed",
    }),
  );

  let feedName = followingFeedName;
  let unknown = false;

  if (defaultFeed !== "following") {
    const data = savedFeeds.data?.feeds ?? [];
    const feed = data.find((x) => x.uri === defaultFeed);
    if (feed) {
      feedName = feed.displayName;
    } else {
      unknown = true;
    }
  }

  const preferences = usePreferences();

  const setPreference = useMutation({
    mutationFn: async (
      feedViewPref: Partial<Omit<app.bsky.actor.defs.FeedViewPref, "feed">>,
    ) => {
      if (!preferences.data) throw new Error(_(msg`No preferences`));

      await agent.call(app.bsky.actor.putPreferences, {
        preferences: produce(preferences.data, (draft) => {
          const existing = draft.find(
            (x) =>
              isType(app.bsky.actor.defs.feedViewPref, x) && x.feed === "home",
          );
          if (existing && isType(app.bsky.actor.defs.feedViewPref, existing)) {
            Object.assign(existing, feedViewPref);
          } else {
            draft.push({
              ...defaultFeedViewPref,
              ...feedViewPref,
            });
          }
        }),
      });
    },
    onSettled: () => preferences.refetch(),
  });

  if (preferences.data) {
    const feedViewPref = getFeedViewPref(preferences.data);

    const feeds = savedFeeds.data
      ? savedFeeds.data.pinned
          .map((pin) => savedFeeds.data.feeds.find((f) => f.uri === pin)!)
          .filter((x) => x !== undefined)
      : [];

    return (
      <TransparentHeaderUntilScrolled>
        <GroupedList
          groups={[
            {
              title: _(msg`Home screen`),
              options: [
                {
                  title: _(msg`Home screen layout`),
                  action: (
                    <Menu
                      groups={[
                        {
                          key: "layout",
                          items: [
                            {
                              type: "toggle",
                              key: "feeds list",
                              label: _(msg`Feeds list`),
                              checked: homepage === "feeds",
                              onCheckedChange: (checked) =>
                                checked &&
                                setAppPreferences({ homepage: "feeds" }),
                            },
                            {
                              type: "toggle",
                              key: "specific feed",
                              label: _(msg`Primary feed`),
                              checked: homepage === "skyline",
                              onCheckedChange: (checked) =>
                                checked &&
                                setAppPreferences({ homepage: "skyline" }),
                            },
                          ],
                        },
                      ]}
                    >
                      <View className="flex-row items-center gap-x-1">
                        <Text primary className="text-base font-medium">
                          {homepage === "feeds" ? (
                            <Trans>Feeds list</Trans>
                          ) : (
                            <Trans>Primary feed</Trans>
                          )}
                        </Text>
                        <ChevronsUpDownIcon
                          size={16}
                          color={theme.colors.primary}
                        />
                      </View>
                    </Menu>
                  ),
                },
                ...(homepage === "skyline"
                  ? [
                      {
                        title: _(msg`Primary feed`),
                        action: savedFeeds.isSuccess ? (
                          <Menu
                            groups={[
                              {
                                key: "following",
                                items: [
                                  {
                                    type: "toggle",
                                    key: "following",
                                    label: followingFeedName,
                                    checked: defaultFeed === "following",
                                    onCheckedChange: (checked) =>
                                      checked &&
                                      setAppPreferences({
                                        defaultFeed: "following",
                                      }),
                                  },
                                ],
                              },
                              {
                                key: "feeds",
                                items: feeds.map((feed) => ({
                                  type: "toggle",
                                  key: feed.uri,
                                  label: feed.displayName,
                                  subtitle: _(msg`By @${feed.creator.handle}`),
                                  checked: feed.uri === defaultFeed,
                                  onCheckedChange: (checked) =>
                                    checked &&
                                    setAppPreferences({
                                      defaultFeed: feed.uri,
                                    }),
                                })),
                              },
                            ]}
                          >
                            <View className="flex-row items-center gap-x-1">
                              <Text
                                style={{
                                  color: unknown
                                    ? theme.colors.notification
                                    : theme.colors.primary,
                                }}
                                className="text-base font-medium"
                              >
                                {unknown ? "Unknown" : feedName}
                              </Text>
                              <ChevronsUpDownIcon
                                size={16}
                                color={theme.colors.primary}
                              />
                            </View>
                          </Menu>
                        ) : (
                          <ActivityIndicator />
                        ),
                      },
                    ]
                  : []),
              ],
            },
            {
              title: _(msg`Reply settings`),
              options: [
                {
                  title: _(msg`Show replies`),
                  action: (
                    <LoadingValue query={setPreference} property="hideReplies">
                      <Switch
                        disabled={setPreference.isPending}
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
                  title: _(msg`Only show replies from your follows`),
                  action: (
                    <LoadingValue
                      query={setPreference}
                      property="hideRepliesByUnfollowed"
                    >
                      <Switch
                        disabled={
                          setPreference.isPending || feedViewPref.hideReplies
                        }
                        value={feedViewPref.hideRepliesByUnfollowed}
                        onValueChange={(value) => {
                          setPreference.mutate({
                            hideRepliesByUnfollowed: value,
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
              title: _(msg`Repost settings`),
              options: [
                {
                  title: _(msg`Show reposts`),
                  action: (
                    <LoadingValue query={setPreference} property="hideReposts">
                      <Switch
                        disabled={setPreference.isPending}
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
              title: _(msg`Quote post settings`),
              options: [
                {
                  title: _(msg`Show quote posts`),
                  action: (
                    <LoadingValue
                      query={setPreference}
                      property="hideQuotePosts"
                    >
                      <Switch
                        disabled={setPreference.isPending}
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
      </TransparentHeaderUntilScrolled>
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
    app.bsky.actor.defs.FeedViewPref,
    | "hideReplies"
    | "hideRepliesByUnfollowed"
    | "hideRepliesByLikeCount"
    | "hideReposts"
    | "hideQuotePosts"
  >;
  query: UseMutationResult<
    void,
    unknown,
    Partial<Omit<app.bsky.actor.defs.FeedViewPref, "feed">>,
    unknown
  >;
}) => {
  if (
    query.isPending &&
    property in (query.variables as app.bsky.actor.defs.FeedViewPref)
  ) {
    return <ActivityIndicator size="small" />;
  }
  return <>{children}</>;
};
