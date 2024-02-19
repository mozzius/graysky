import { useState } from "react";
import { Platform, Switch, View } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { msg, Trans } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import {
  ChevronsUpDownIcon,
  MegaphoneOffIcon,
  ShieldXIcon,
} from "lucide-react-native";
import * as DropdownMenu from "zeego/dropdown-menu";

import { GroupedList } from "~/components/grouped-list";
import { ItemSeparator } from "~/components/item-separator";
import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";
import { contentLabels, usePreferences } from "~/lib/hooks/preferences";
import { produce } from "~/lib/utils/produce";

const options = ["show", "warn", "hide"] as const;

type Pref = (typeof options)[number];

export default function ModerationSettings() {
  const agent = useAgent();
  const theme = useTheme();
  const { _ } = useLingui();

  const [optimisticSwitchValue, setOptimisticSwitchValue] = useState(false);

  const preferences = usePreferences();

  const setPreference = useMutation({
    mutationFn: async ({
      label,
      visibility,
    }: AppBskyActorDefs.ContentLabelPref) => {
      if (!preferences.data) throw new Error(_(msg`No preferences`));
      const newPref = {
        $type: "app.bsky.actor.defs#contentLabelPref",
        label,
        visibility,
      } satisfies AppBskyActorDefs.ContentLabelPref;

      await agent.app.bsky.actor.putPreferences({
        preferences: produce(preferences.data, (draft) => {
          const index = draft.findIndex(
            (x) => x.$type === newPref.$type && x.label === label,
          );
          if (index === -1) {
            draft.push(newPref);
          } else {
            draft[index] = newPref;
          }
        }),
      });
    },
    onSettled: () => preferences.refetch(),
  });

  const adultContentPref = preferences.data?.find((x) =>
    AppBskyActorDefs.isAdultContentPref(x),
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
      await agent.app.bsky.actor.putPreferences({
        preferences: produce(preferences.data, (draft) => {
          const index = draft.findIndex((x) =>
            AppBskyActorDefs.isAdultContentPref(x),
          );
          if (index === -1) {
            draft.push({
              $type: "app.bsky.actor.defs#adultContentPref",
              enabled: true,
            });
          } else {
            draft[index]!.enabled = !draft[index]!.enabled;
          }
        }),
      });
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
        <GroupedList
          groups={[
            {
              title: _(msg`Blocks & Mutes`),
              options: [
                {
                  title: _(msg`Blocked users`),
                  href: "/settings/blocks",
                  icon: ShieldXIcon,
                },
                {
                  title: _(msg`Muted users`),
                  href: "/settings/mutes",
                  icon: MegaphoneOffIcon,
                },
              ],
            },
            {
              title: _(msg`Content filters`),
              children: Platform.OS === "ios" && (
                <>
                  <View className="px-4 py-3">
                    <Text>
                      <Trans>
                        Note: Adult content settings cannot be changed on iOS.
                        Please use the web app instead.
                      </Trans>
                    </Text>
                  </View>
                  <ItemSeparator />
                </>
              ),
              options: [
                {
                  title: _(msg`Enable Adult Content`),
                  action: (
                    <Switch
                      disabled={Platform.OS === "ios"}
                      value={
                        toggleAdultContent.isPending
                          ? optimisticSwitchValue
                          : adultContentEnabled
                      }
                      onValueChange={() => toggleAdultContent.mutate()}
                    />
                  ),
                },
                ...Object.entries(contentLabels).map(
                  ([key, { label, defaultValue, adult }]) => {
                    let visibility = preferences.data.find(
                      (x) => x.label === key,
                    )?.visibility as Pref;

                    if (!["show", "warn", "hide"].includes(visibility)) {
                      visibility = defaultValue as Pref;
                    }

                    if (
                      adult &&
                      (!adultContentEnabled || Platform.OS === "ios")
                    ) {
                      return {
                        title: label,
                        action: (
                          <View className="flex-row items-center gap-x-1">
                            <Text className="text-base font-medium text-neutral-400 dark:text-neutral-300">
                              {
                                translateMap[
                                  adultContentEnabled ? visibility : "hide"
                                ]
                              }
                            </Text>
                            <ChevronsUpDownIcon
                              size={16}
                              className="text-neutral-400 dark:text-neutral-300"
                            />
                          </View>
                        ),
                      };
                    }

                    return {
                      title: label,
                      action: (
                        <DropdownMenu.Root>
                          <DropdownMenu.Trigger>
                            <View className="flex-row items-center gap-x-1">
                              <Text
                                className="text-base font-medium capitalize"
                                primary
                              >
                                {visibility}
                              </Text>
                              <ChevronsUpDownIcon
                                size={16}
                                color={theme.colors.primary}
                              />
                            </View>
                          </DropdownMenu.Trigger>
                          <DropdownMenu.Content>
                            {options.map((option) => (
                              <DropdownMenu.CheckboxItem
                                key={option}
                                value={visibility === option ? "on" : "off"}
                                onValueChange={(value) =>
                                  value === "on" &&
                                  setPreference.mutate({
                                    label: key,
                                    visibility: option,
                                  })
                                }
                              >
                                <DropdownMenu.ItemTitle>
                                  {translateMap[option]}
                                </DropdownMenu.ItemTitle>
                                <DropdownMenu.ItemIndicator />
                              </DropdownMenu.CheckboxItem>
                            ))}
                          </DropdownMenu.Content>
                        </DropdownMenu.Root>
                      ),
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
