import { useState } from "react";
import { Platform, Switch, Text, TouchableOpacity, View } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQuery } from "@tanstack/react-query";
import { produce } from "immer";

import { QueryWithoutData } from "../../components/query-without-data";
import { useAuthedAgent } from "../../lib/agent";
import { useColorScheme } from "../../lib/utils/color-scheme";
import { SettingsList } from "./_layout";

type Pref = "show" | "warn" | "hide";

const contentLabels = {
  nsfw: "Explicit Sexual Images",
  nudity: "Other Nudity",
  suggestive: "Sexually Suggestive",
  gore: "Violent / Bloody",
  hate: "Political Hate-Groups",
  spam: "Spam",
  impersonation: "Impersonation",
} as const;

const adultContentLabels = ["nsfw", "nudity", "suggestive", "gore"];

export default function ModerationSettings() {
  const agent = useAuthedAgent();
  const theme = useTheme();
  const { colorScheme } = useColorScheme();
  const { showActionSheetWithOptions } = useActionSheet();
  const [optimisticSwitchValue, setOptimisticSwitchValue] = useState(false);

  const preferences = useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      const prefs = await agent.app.bsky.actor.getPreferences();
      if (!prefs.success) throw new Error("Could not get preferences");
      return prefs.data.preferences;
    },
  });

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
      console.log(newPref);
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

  const adultContentEnabled = !!preferences.data?.find((x) =>
    AppBskyActorDefs.isAdultContentPref(x),
  )?.enabled;

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

  console.log(JSON.stringify(preferences.data, null, 2));

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
          ...Object.entries(contentLabels).map(([key, label]) => {
            let visibility = preferences.data.find((x) => x.label === key)
              ?.visibility as Pref;

            if (!["show", "warn", "hide"].includes(visibility)) {
              visibility = "hide";
            }

            if (
              adultContentLabels.includes(key) &&
              (!adultContentEnabled || Platform.OS === "ios")
            ) {
              return {
                title: label,
                action: (
                  <Text className="text-base font-medium capitalize text-neutral-400">
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
                    className="text-base font-medium capitalize dark:text-white"
                  >
                    {visibility}
                  </Text>
                </TouchableOpacity>
              ),
            };
          }),
        ]}
      >
        {Platform.OS === "ios" && (
          <View className="border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
            <Text className="dark:text-white">
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
