import { ActivityIndicator, Switch, TouchableOpacity } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import {
  ChevronsUpDownIcon,
  CircleDotIcon,
  CloudIcon,
  CloudyIcon,
} from "lucide-react-native";

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
import { actionSheetStyles } from "~/lib/utils/action-sheet";
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
  const { showActionSheetWithOptions } = useActionSheet();
  const theme = useTheme();
  const savedFeeds = useSavedFeeds();

  let feedName = "Following";
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
      <TransparentHeaderUntilScrolled>
        <GroupedList
          groups={[
            {
              title: "ホーム画面",
              options: [
                {
                  title: "ホーム画面のレイアウト",
                  action: (
                    <TouchableOpacity
                      onPress={() => {
                        const options = ["フィードのリスト", "特定のフィード"];
                        const icons = [
                          <CloudyIcon
                            size={24}
                            color={theme.colors.text}
                            key={0}
                          />,
                          <CloudIcon
                            size={24}
                            color={theme.colors.text}
                            key={1}
                          />,
                          <></>,
                        ];
                        showActionSheetWithOptions(
                          {
                            options: [...options, "キャンセル"],
                            icons,
                            cancelButtonIndex: options.length,
                            ...actionSheetStyles(theme),
                          },
                          (index) => {
                            switch (index) {
                              case 0:
                                setAppPreferences({ homepage: "feeds" });
                                break;
                              case 1:
                                setAppPreferences({ homepage: "skyline" });
                                break;
                            }
                          },
                        );
                      }}
                      className="flex-row items-center"
                    >
                      <Text
                        primary
                        className="text-base font-medium capitalize"
                      >
                        {homepage === "feeds" ? "Feeds list" : "プライマリフィード"}
                      </Text>
                      <ChevronsUpDownIcon
                        size={16}
                        color={theme.colors.primary}
                        className="ml-1"
                      />
                    </TouchableOpacity>
                  ),
                },
                ...(homepage === "skyline"
                  ? [
                      {
                        title: "プライマリフィード",
                        action: (
                          <TouchableOpacity
                            disabled={savedFeeds.isPending}
                            onPress={() => {
                              const data = savedFeeds.data
                                ? savedFeeds.data.pinned
                                    .map(
                                      (pin) =>
                                        savedFeeds.data.feeds.find(
                                          (f) => f.uri === pin,
                                        )!,
                                    )
                                    .filter((x) => x !== undefined)
                                : [];

                              const options = [
                                "Following",
                                ...data.map((x) => x.displayName),
                              ];
                              const icons = [
                                defaultFeed === "following" ? (
                                  <CircleDotIcon
                                    key={0}
                                    color={theme.colors.text}
                                    size={24}
                                  />
                                ) : (
                                  <></>
                                ),
                                ...(savedFeeds.data
                                  ? savedFeeds.data.pinned
                                      .map(
                                        (pin) =>
                                          savedFeeds.data.feeds.find(
                                            (f) => f.uri === pin,
                                          )!,
                                      )
                                      .filter((x) => x !== undefined)
                                      .map((x, i) =>
                                        x.uri === defaultFeed ? (
                                          <CircleDotIcon
                                            key={i + 1}
                                            color={theme.colors.text}
                                            size={24}
                                          />
                                        ) : (
                                          <></>
                                        ),
                                      )
                                  : []),
                                <></>,
                              ];
                              showActionSheetWithOptions(
                                {
                                  title: "プライマリフィードを選択",
                                  options: [...options, "キャンセル"],
                                  icons,
                                  cancelButtonIndex: options.length,
                                  ...actionSheetStyles(theme),
                                },
                                (index) => {
                                  if (
                                    index === undefined ||
                                    index === options.length
                                  )
                                    return;
                                  if (index === 0) {
                                    setAppPreferences({
                                      defaultFeed: "following",
                                    });
                                  } else {
                                    setAppPreferences({
                                      defaultFeed: data[index - 1]!.uri,
                                    });
                                  }
                                },
                              );
                            }}
                            className="flex-row items-center"
                          >
                            {savedFeeds.isSuccess ? (
                              <>
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
                                  className="ml-1"
                                />
                              </>
                            ) : (
                              <ActivityIndicator />
                            )}
                          </TouchableOpacity>
                        ),
                      },
                    ]
                  : []),
              ],
            },
            {
              title: "返信の設定",
              options: [
                {
                  title: "返信を表示",
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
                  title: "フォローしている人からの返信のみ表示",
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
              title: "リポストの設定",
              options: [
                {
                  title: "リポストを表示",
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
              title: "引用ポストの設定",
              options: [
                {
                  title: "引用ポストを表示",
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
