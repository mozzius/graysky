import { useState } from "react";
import { Platform, View } from "react-native";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { Trans } from "@lingui/react/macro";
import { useMutation } from "@tanstack/react-query";

import { Form } from "~/components/form";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import {
  contentLabels,
  putPreferences,
  usePreferences,
} from "~/lib/hooks/preferences";
import { produce } from "~/lib/utils/produce";
import { isType } from "~/lib/utils/types";

const options = ["show", "warn", "hide"] as const;

type Pref = (typeof options)[number];

export default function ModerationSettings() {
  const agent = useAgent();
  const { _ } = useLingui();

  const [optimisticSwitchValue, setOptimisticSwitchValue] = useState(false);

  const preferences = usePreferences();

  const setPreference = useMutation({
    mutationFn: async ({
      label,
      visibility,
    }: app.bsky.actor.defs.ContentLabelPref) => {
      if (!preferences.data) throw new Error(_(msg`No preferences`));
      const newPref = {
        $type: "app.bsky.actor.defs#contentLabelPref",
        label,
        visibility,
      } satisfies app.bsky.actor.defs.ContentLabelPref;

      await putPreferences(
        agent,
        produce(preferences.data, (draft) => {
          const index = draft.findIndex(
            (x) =>
              isType(app.bsky.actor.defs.contentLabelPref, x) &&
              x.label === label,
          );
          if (index === -1) {
            draft.push(newPref);
          } else {
            draft[index] = newPref;
          }
        }),
      );
    },
    onSettled: () => preferences.refetch(),
  });

  const adultContentPref = preferences.data?.find((x) =>
    isType(app.bsky.actor.defs.adultContentPref, x),
  )?.enabled;

  const hasAdultContentPref = adultContentPref !== undefined;

  const adultContentEnabled = hasAdultContentPref
    ? !!adultContentPref
    : Platform.OS === "ios"
      ? false
      : true;

  const toggleAdultContent = useMutation({
    mutationFn: async () => {
      if (!preferences.data) throw new Error("No preferences");
      setOptimisticSwitchValue(!adultContentEnabled);
      await putPreferences(
        agent,
        produce(preferences.data, (draft) => {
          const existing = draft.find((x) =>
            isType(app.bsky.actor.defs.adultContentPref, x),
          );
          if (
            existing &&
            isType(app.bsky.actor.defs.adultContentPref, existing)
          ) {
            existing.enabled = !existing.enabled;
          } else {
            draft.push({
              $type: "app.bsky.actor.defs#adultContentPref",
              enabled: true,
            });
          }
        }),
      );
    },
    onSettled: () => preferences.refetch(),
  });

  const translateMap = {
    show: _(msg`Show`),
    warn: _(msg`Warn`),
    hide: _(msg`Hide`),
  } as const;

  if (preferences.data) {
    return (
      <TransparentHeaderUntilScrolled>
        <Form
          sections={[
            {
              title: _(msg`Blocks & Mutes`),
              rows: [
                {
                  title: _(msg`Blocked users`),
                  href: "/settings/blocks",
                  icon: "block",
                },
                {
                  title: _(msg`Muted users`),
                  href: "/settings/mutes",
                  icon: "mute",
                },
              ],
            },
            {
              title: _(msg`Content filters`),
              rows: [
                Platform.OS === "ios" && {
                  type: "custom",
                  key: "ios-note",
                  children: (
                    <View className="px-4 py-3">
                      <Text>
                        <Trans>
                          Note: Adult content settings cannot be changed on iOS.
                          Please use the web app instead.
                        </Trans>
                      </Text>
                    </View>
                  ),
                },
                {
                  type: "toggle",
                  title: _(msg`Enable Adult Content`),
                  disabled: Platform.OS === "ios",
                  value: toggleAdultContent.isPending
                    ? optimisticSwitchValue
                    : adultContentEnabled,
                  onValueChange: () => toggleAdultContent.mutate(),
                },
                ...Object.entries(contentLabels).map(
                  ([key, { label, defaultValue, adult }]) => {
                    let visibility = preferences.data
                      .filter((x) =>
                        isType(app.bsky.actor.defs.contentLabelPref, x),
                      )
                      .find((x) => x.label === key)?.visibility as Pref;

                    if (!["show", "warn", "hide"].includes(visibility)) {
                      visibility = defaultValue as Pref;
                    }

                    const locked =
                      adult && (!adultContentEnabled || Platform.OS === "ios");

                    return {
                      type: "picker" as const,
                      key,
                      title: label,
                      disabled: locked,
                      value:
                        locked && !adultContentEnabled ? "hide" : visibility,
                      options: options.map((option) => ({
                        value: option,
                        label: translateMap[option],
                      })),
                      onValueChange: (option: string) =>
                        setPreference.mutate({
                          label: key,
                          visibility: option,
                        }),
                    };
                  },
                ),
              ],
            },
          ]}
        />
      </TransparentHeaderUntilScrolled>
    );
  }

  return <QueryWithoutData query={preferences} />;
}
