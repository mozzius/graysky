import { type $Typed } from "@atproto/lex";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useMutation } from "@tanstack/react-query";

import { Form } from "~/components/form";
import { QueryWithoutData } from "~/components/query-without-data";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { useSavedFeeds } from "~/lib/hooks";
import { putPreferences, usePreferences } from "~/lib/hooks/preferences";
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

      await putPreferences(
        agent,
        produce(preferences.data, (draft) => {
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
      );
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

    // show a spinner in place of the switch that's being changed
    const isSaving = (property: keyof typeof defaultFeedViewPref) =>
      setPreference.isPending &&
      !!setPreference.variables &&
      property in setPreference.variables;

    return (
      <TransparentHeaderUntilScrolled>
        <Form
          sections={[
            {
              title: _(msg`Home screen`),
              rows: [
                {
                  type: "picker",
                  title: _(msg`Home screen layout`),
                  value: homepage,
                  options: [
                    { value: "feeds", label: _(msg`Feeds list`) },
                    { value: "skyline", label: _(msg`Primary feed`) },
                  ],
                  onValueChange: (value) =>
                    setAppPreferences({
                      homepage: value === "feeds" ? "feeds" : "skyline",
                    }),
                },
                homepage === "skyline" && {
                  type: "picker",
                  title: _(msg`Primary feed`),
                  loading: !savedFeeds.isSuccess,
                  value: defaultFeed,
                  options: [
                    { value: "following", label: followingFeedName },
                    ...feeds.map((feed) => ({
                      value: feed.uri,
                      label: feed.displayName,
                      subtitle: _(msg`By @${feed.creator.handle}`),
                    })),
                    // the current feed might not be pinned
                    ...(defaultFeed !== "following" &&
                    !feeds.some((feed) => feed.uri === defaultFeed)
                      ? [
                          {
                            value: defaultFeed,
                            label: unknown ? "Unknown" : feedName,
                          },
                        ]
                      : []),
                  ],
                  onValueChange: (value) =>
                    setAppPreferences({ defaultFeed: value }),
                },
              ],
            },
            {
              title: _(msg`Reply settings`),
              rows: [
                {
                  type: "toggle",
                  title: _(msg`Show replies`),
                  loading: isSaving("hideReplies"),
                  disabled: setPreference.isPending,
                  value: !feedViewPref.hideReplies,
                  onValueChange: (value) => {
                    setPreference.mutate({
                      hideReplies: !value,
                    });
                  },
                },
                {
                  type: "toggle",
                  title: _(msg`Only show replies from your follows`),
                  loading: isSaving("hideRepliesByUnfollowed"),
                  disabled: setPreference.isPending || feedViewPref.hideReplies,
                  value: !!feedViewPref.hideRepliesByUnfollowed,
                  onValueChange: (value) => {
                    setPreference.mutate({
                      hideRepliesByUnfollowed: value,
                    });
                  },
                },
              ],
            },
            {
              title: _(msg`Repost settings`),
              rows: [
                {
                  type: "toggle",
                  title: _(msg`Show reposts`),
                  loading: isSaving("hideReposts"),
                  disabled: setPreference.isPending,
                  value: !feedViewPref.hideReposts,
                  onValueChange: (value) => {
                    setPreference.mutate({
                      hideReposts: !value,
                    });
                  },
                },
              ],
            },
            {
              title: _(msg`Quote post settings`),
              rows: [
                {
                  type: "toggle",
                  title: _(msg`Show quote posts`),
                  loading: isSaving("hideQuotePosts"),
                  disabled: setPreference.isPending,
                  value: !feedViewPref.hideQuotePosts,
                  onValueChange: (value) => {
                    setPreference.mutate({
                      hideQuotePosts: !value,
                    });
                  },
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
