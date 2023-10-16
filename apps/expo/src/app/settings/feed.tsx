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
import { Text } from "~/components/text";
import { useAgent } from "~/lib/agent";
import { useSavedFeeds } from "~/lib/hooks";
import { useAppPreferences, usePreferences } from "~/lib/hooks/preferences";
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
  const [appPrefs, setAppPrefs] = useAppPreferences();
  const { showActionSheetWithOptions } = useActionSheet();
  const theme = useTheme();
  const savedFeeds = useSavedFeeds();

  let defaultFeed = "Following";
  let unknown = false;

  if (appPrefs.defaultFeed !== "following") {
    const data = savedFeeds.data?.feeds ?? [];
    const feed = data.find((x) => x.uri === appPrefs.defaultFeed);
    if (feed) {
      defaultFeed = feed.displayName;
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
      <GroupedList
        groups={[
          {
            title: "Home screen",
            options: [
              {
                title: "Home screen layout",
                action: (
                  <TouchableOpacity
                    onPress={() => {
                      const options = ["Feeds list", "A specific feed"];
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
                          options: [...options, "Cancel"],
                          icons,
                          cancelButtonIndex: options.length,
                          userInterfaceStyle: theme.dark ? "dark" : "light",
                          textStyle: { color: theme.colors.text },
                          containerStyle: {
                            backgroundColor: theme.colors.card,
                          },
                        },
                        (index) => {
                          switch (index) {
                            case 0:
                              setAppPrefs({ homepage: "feeds" });
                              break;
                            case 1:
                              setAppPrefs({ homepage: "skyline" });
                              break;
                          }
                        },
                      );
                    }}
                    className="flex-row items-center"
                  >
                    <Text
                      style={{ color: theme.colors.primary }}
                      className="text-base font-medium capitalize"
                    >
                      {appPrefs.homepage === "feeds"
                        ? "Feeds list"
                        : "Primary feed"}
                    </Text>
                    <ChevronsUpDownIcon
                      size={16}
                      color={theme.colors.primary}
                      className="ml-1"
                    />
                  </TouchableOpacity>
                ),
              },
              ...(appPrefs.homepage === "skyline"
                ? [
                    {
                      title: "Primary feed",
                      action: (
                        <TouchableOpacity
                          disabled={savedFeeds.isLoading}
                          onPress={() => {
                            const data = savedFeeds.data
                              ? savedFeeds.data.pinned.map(
                                  (pin) =>
                                    savedFeeds.data.feeds.find(
                                      (f) => f.uri === pin,
                                    )!,
                                )
                              : [];

                            const options = [
                              "Following",
                              ...data.map((x) => x.displayName),
                            ];
                            const icons = [
                              appPrefs.defaultFeed === "following" ? (
                                <CircleDotIcon
                                  key={0}
                                  color={theme.colors.text}
                                  size={24}
                                />
                              ) : (
                                <></>
                              ),
                              data.map((x, i) =>
                                x.uri === appPrefs.defaultFeed ? (
                                  <CircleDotIcon
                                    key={i + 1}
                                    color={theme.colors.text}
                                    size={24}
                                  />
                                ) : (
                                  <></>
                                ),
                              ),
                              <></>,
                            ];
                            showActionSheetWithOptions(
                              {
                                title: "Select home feed",
                                options: [...options, "Cancel"],
                                icons,
                                cancelButtonIndex: options.length,
                                userInterfaceStyle: theme.dark
                                  ? "dark"
                                  : "light",
                                textStyle: { color: theme.colors.text },
                                containerStyle: {
                                  backgroundColor: theme.colors.card,
                                },
                              },
                              (index) => {
                                if (
                                  index === undefined ||
                                  index === options.length
                                )
                                  return;
                                if (index === 0) {
                                  setAppPrefs({ defaultFeed: "following" });
                                } else {
                                  setAppPrefs({
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
                                {unknown ? "Unknown" : defaultFeed}
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
