import { ActivityIndicator, Switch, View } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { ChevronsUpDownIcon } from "lucide-react-native";
import * as DropdownMenu from "zeego/dropdown-menu";

import { GroupedList } from "~/components/grouped-list";
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

const defaultFeedViewPref = {
  hideReplies: false,
  hideRepliesByUnfollowed: false,
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
  const defaultFeed = useDefaultFeed();
  const homepage = useHomepage();
  const setAppPreferences = useSetAppPreferences();

  const theme = useTheme();
  const savedFeeds = useSavedFeeds();
  const { _ } = useLingui();

  let feedName = _(msg`Following`);
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
      feedViewPref: Omit<AppBskyActorDefs.FeedViewPref, "feed">,
    ) => {
      if (!preferences.data) throw new Error(_(msg`No preferences`));

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
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger>
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
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Content>
                        <DropdownMenu.CheckboxItem
                          key="feeds list"
                          textValue={_(msg`Feeds list`)}
                          value={homepage === "feeds" ? "on" : "off"}
                          onValueChange={(value) =>
                            value === "on" &&
                            setAppPreferences({ homepage: "feeds" })
                          }
                        >
                          <DropdownMenu.ItemIndicator />
                        </DropdownMenu.CheckboxItem>
                        <DropdownMenu.CheckboxItem
                          key="specific feed"
                          textValue={_(msg`Primary feed`)}
                          value={homepage === "skyline" ? "on" : "off"}
                          onValueChange={(value) =>
                            value === "on" &&
                            setAppPreferences({ homepage: "skyline" })
                          }
                        >
                          <DropdownMenu.ItemIndicator />
                        </DropdownMenu.CheckboxItem>
                      </DropdownMenu.Content>
                    </DropdownMenu.Root>
                  ),
                },
                ...(homepage === "skyline"
                  ? [
                      {
                        title: _(msg`Primary feed`),
                        action: savedFeeds.isSuccess ? (
                          <DropdownMenu.Root>
                            <DropdownMenu.Trigger>
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
                            </DropdownMenu.Trigger>
                            <DropdownMenu.Content>
                              <DropdownMenu.CheckboxItem
                                key="following"
                                textValue={_(msg`Following`)}
                                value={
                                  defaultFeed === "following" ? "on" : "off"
                                }
                                onValueChange={(value) =>
                                  value === "on" &&
                                  setAppPreferences({
                                    defaultFeed: "following",
                                  })
                                }
                              >
                                <DropdownMenu.ItemIndicator />
                              </DropdownMenu.CheckboxItem>
                              <DropdownMenu.Group>
                                {feeds.map((feed) => (
                                  <DropdownMenu.CheckboxItem
                                    key={feed.uri}
                                    textValue={feed.displayName}
                                    value={
                                      feed.uri === defaultFeed ? "on" : "off"
                                    }
                                    onValueChange={(value) =>
                                      value === "on" &&
                                      setAppPreferences({
                                        defaultFeed: feed.uri,
                                      })
                                    }
                                  >
                                    <DropdownMenu.ItemSubtitle>
                                      {_(msg`By @${feed.creator.handle}`)}
                                    </DropdownMenu.ItemSubtitle>
                                    <DropdownMenu.ItemIndicator />
                                  </DropdownMenu.CheckboxItem>
                                ))}
                              </DropdownMenu.Group>
                            </DropdownMenu.Content>
                          </DropdownMenu.Root>
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
    query.isPending &&
    property in (query.variables as AppBskyActorDefs.FeedViewPref)
  ) {
    return <ActivityIndicator size="small" />;
  }
  return <>{children}</>;
};
