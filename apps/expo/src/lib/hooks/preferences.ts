import { useCallback } from "react";
import { Platform } from "react-native";
import { AppBskyActorDefs, type ComAtprotoLabelDefs } from "@atproto/api";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { useAgent } from "../agent";

// TODO: Refactor to new Content Moderation API!
// https://github.com/bluesky-social/atproto/blob/HEAD/packages/api/docs/moderation.md

export const contentLabels = {
  nsfw: {
    label: "Explicit Sexual Images",
    defaultValue: "warn",
    values: ["porn", "nsfl"],
    adult: true,
    message: "This post contains explicit sexual images",
  },
  nudity: {
    label: "Other Nudity",
    defaultValue: "warn",
    values: ["nudity"],
    adult: true,
    message: "This post contains nudity",
  },
  suggestive: {
    label: "Sexually Suggestive",
    defaultValue: "show",
    values: ["sexual"],
    adult: true,
    message: "This post contains sexually suggestive content",
  },
  gore: {
    label: "Violent / Bloody",
    defaultValue: "hide",
    values: ["gore", "self-harm", "torture", "nsfl", "corpse"],
    adult: true,
    message: "This post contains violent or bloody content",
  },
  hate: {
    label: "Political Hate-Groups",
    defaultValue: "warn",
    values: ["icon-kkk", "icon-nazi", "icon-intolerant", "behavior-intolerant"],
    adult: false,
    message: "This post has political hate content",
  },
  spam: {
    label: "Spam",
    defaultValue: "hide",
    values: ["spam"],
    adult: false,
    message: "This post has been flagged as spam",
  },
  impersonation: {
    label: "Impersonation",
    defaultValue: "warn",
    values: ["impersonation"],
    adult: false,
    message: "This post has been flagged as impersonation",
  },
};

export const adultContentLabels = ["nsfw", "nudity", "suggestive", "gore"];

export const usePreferences = () => {
  const agent = useAgent();
  return useQuery({
    queryKey: ["preferences"],
    queryFn: async () => {
      const prefs = await agent.app.bsky.actor.getPreferences();
      if (!prefs.success) throw new Error("Could not get preferences");
      return prefs.data.preferences;
    },
  });
};

export type FilterResult = {
  visibility: "warn" | "hide";
  message: string;
} | null;

export const useContentFilter = () => {
  const preferences = usePreferences();

  const contentFilter = useCallback(
    (labels?: ComAtprotoLabelDefs.Label[]): FilterResult => {
      if (!labels || labels.length === 0) return null;
      if (!preferences.data) throw new Error("No preferences");

      let warn: FilterResult = null;

      const adultContentPref = preferences.data?.find((x) =>
        AppBskyActorDefs.isAdultContentPref(x),
      )?.enabled;

      const hasAdultContentPref = adultContentPref !== undefined;

      const adultContentEnabled = hasAdultContentPref
        ? !!adultContentPref
        : Platform.OS === "ios"
        ? false
        : true;

      for (const label of labels) {
        const foundLabel = Object.entries(contentLabels)
          .map(([key, value]) => ({ key, ...value }))
          .find(({ values }) => values.includes(label.val));

        if (!foundLabel) continue;

        if (foundLabel.adult && !adultContentEnabled)
          return {
            visibility: "hide",
            message: foundLabel.message,
          };

        const pref = preferences.data.find(
          (prefs) =>
            AppBskyActorDefs.isContentLabelPref(prefs) &&
            prefs.label === foundLabel.key,
        );

        if (!pref) continue;

        switch (pref.visibility) {
          case "hide":
            return {
              visibility: "hide",
              message: foundLabel.message,
            };
          case "warn":
            warn = {
              visibility: "warn",
              message: foundLabel.message,
            };
            break;
        }
      }

      return warn;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferences.dataUpdatedAt, preferences.data],
  );

  return {
    preferences,
    contentFilter,
  };
};

const appPrefsSchema = z.object({
  groupNotifications: z.boolean(),
  copiedCodes: z.array(z.string()),
});

type AppPrefs = z.infer<typeof appPrefsSchema>;

const defaultAppPrefs: AppPrefs = {
  groupNotifications: true,
  copiedCodes: [],
};

export const useAppPreferences = () => {
  const queryClient = useQueryClient();

  const appPrefs = useQuery({
    queryKey: ["app-prefs"],
    queryFn: async () => {
      const parsed = appPrefsSchema
        .partial()
        .safeParse(
          JSON.parse((await AsyncStorage.getItem("app-preferences")) ?? "{}"),
        );
      if (parsed.success) {
        // Merge with default prefs
        // catches any new prefs added in the default
        return {
          ...defaultAppPrefs,
          ...parsed.data,
        };
      } else {
        await AsyncStorage.setItem(
          "app-preferences",
          JSON.stringify(defaultAppPrefs),
        );
        return defaultAppPrefs;
      }
    },
  });

  const setAppPrefs = useMutation({
    mutationFn: async (prefs: Partial<AppPrefs>) => {
      if (!appPrefs.data) return;
      const newPrefs = { ...appPrefs.data, ...prefs };
      queryClient.setQueryData(["app-prefs"], newPrefs);
      await AsyncStorage.setItem("app-preferences", JSON.stringify(newPrefs));
    },
    onSettled: () => appPrefs.refetch(),
  });

  return { appPrefs, setAppPrefs };
};
