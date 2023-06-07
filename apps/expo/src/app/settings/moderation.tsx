import { useState } from "react";
import { Platform, Switch, Text, TouchableOpacity, View } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { produce } from "immer";

import { QueryWithoutData } from "../../components/query-without-data";
import { useAuthedAgent } from "../../lib/agent";
import { contentLabels, usePreferences } from "../../lib/hooks/preferences";
import { useColorScheme } from "../../lib/utils/color-scheme";
import { SettingsList } from "./_layout";

type Pref = "show" | "warn" | "hide";

export default function ModerationSettings() {
  const agent = useAuthedAgent();
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const [optimisticSwitchValue, setOptimisticSwitchValue] = useState(false);

  const preferences = usePreferences();

  const setPreference = useMutation({
    mutationFn: async ({
      label,
      visibility,
    }: AppBskyActorDefs.ContentLabelPref) => {
      if (!preferences.data) throw new Error("No preferences");
      const newPref = {
        $type: "app.bsky.actor.defs#contentLabelPref",
        label,
        visibility,
      } satisfies AppBskyActorDefs.ContentLabelPref;

      await agent.app.bsky.actor.putPreferences({
        preferences: produce(preferences.data, (draft) => {
          const index = draft.findIndex((x) => x.label === label);
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

  if (preferences.data) {
    return (
      <SettingsList
        options={[
          {
            title: "Enable Adult Content",
            action: (
              <Switch
                disabled={Platform.OS === "ios"}
                value={
                  toggleAdultContent.isLoading
                    ? optimisticSwitchValue
                    : adultContentEnabled
                }
                onValueChange={() => toggleAdultContent.mutate()}
              />
            ),
          },
          ...Object.entries(contentLabels).map(
            ([key, { label, defaultValue, adult }]) => {
              let visibility = preferences.data.find((x) => x.label === key)
                ?.visibility as Pref;

              if (!["show", "warn", "hide"].includes(visibility)) {
                visibility = defaultValue as Pref;
              }

              if (adult && (!adultContentEnabled || Platform.OS === "ios")) {
                return {
                  title: label,
                  action: (
                    <Text className="text-base font-medium capitalize text-neutral-400 dark:text-neutral-300">
                      {adultContentEnabled ? visibility : "Hide"}
                    </Text>
                  ),
                };
              }

              return {
                title: label,
                action: (
                  <TouchableOpacity
                    disabled={setPreference.isLoading}
                    onPress={() => {
                      const options = ["show", "warn", "hide"];
                      showActionSheetWithOptions(
                        {
                          title: label,
                          options: [...options.map(capitalise), "Cancel"],
                          cancelButtonIndex: 3,
                          destructiveButtonIndex: 0,
                          userInterfaceStyle: colorScheme,
                        },
                        (index) => {
                          if (index === undefined || index === 3) return;
                          const selected = options[index];
                          if (!selected) return;
                          setPreference.mutate({
                            label: key,
                            visibility: selected,
                          });
                        },
                      );
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.primary,
                      }}
                      className="text-base font-medium capitalize"
                    >
                      {visibility}
                    </Text>
                  </TouchableOpacity>
                ),
              };
            },
          ),
        ]}
      >
        {Platform.OS === "ios" && (
          <View className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <Text style={{ color: theme.colors.text }}>
              Note: Adult content settings cannot be changed on iOS. Please use
              the web app instead.
            </Text>
          </View>
        )}
      </SettingsList>
    );
  }

  return <QueryWithoutData query={preferences} />;
}

const capitalise = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);
