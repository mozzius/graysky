import { createContext, useCallback, useContext, useMemo } from "react";
import { Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { type Client } from "@atproto/lex";
import { app, com } from "@bsky/sdk/lexicons";
import { useLingui } from "@lingui/react";
import { useQuery } from "@tanstack/react-query";

import { useAgent } from "../agent";
import { reportScopeError } from "../oauth";
import { useHaptics as useHapticsPreference } from "../storage/app-preferences";
import { isType } from "../utils/types";

// TODO: Refactor to new Content Moderation API!
// https://github.com/bluesky-social/atproto/blob/HEAD/packages/api/docs/moderation.md

// also translate when you do this

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

/**
 * preferences live on the PDS, so these go there without a proxy header (the
 * client's bsky.app one would make some PDSes forward them to bluesky's
 * appview). sessions from before we added the preferences scopes get a scope
 * error, which asks them to sign in again
 */
export async function getPreferences(agent: Client) {
  try {
    const { preferences } = await agent.call(
      app.bsky.actor.getPreferences,
      {},
      { service: null },
    );
    return preferences;
  } catch (err) {
    reportScopeError(err);
    throw err;
  }
}

export async function putPreferences(
  agent: Client,
  preferences: app.bsky.actor.defs.Preferences,
) {
  try {
    await agent.call(
      app.bsky.actor.putPreferences,
      { preferences },
      { service: null },
    );
  } catch (err) {
    reportScopeError(err);
    throw err;
  }
}

const PreferencesContext = createContext<ReturnType<
  typeof usePreferencesQuery
> | null>(null);

const usePreferencesQuery = () => {
  const agent = useAgent();

  const query = useQuery({
    queryKey: ["preferences"],
    queryFn: () => getPreferences(agent),
    enabled: !!agent.did,
  });

  return query;
};

export const PreferencesProvider = ({ children }: React.PropsWithChildren) => {
  const query = usePreferencesQuery();

  return (
    <PreferencesContext.Provider value={query}>
      {children}
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const query = useContext(PreferencesContext);
  if (!query) throw new Error("No preferences context, or no session");
  return query;
};

export type FilterResult = {
  visibility: "warn" | "hide";
  message: string;
} | null;

export const useHaptics = () => {
  const haptics = useHapticsPreference();

  return useMemo(
    () => ({
      impact: (type?: Haptics.ImpactFeedbackStyle) => {
        if (haptics) {
          void Haptics.impactAsync(
            type ??
              Platform.select({
                android: Haptics.ImpactFeedbackStyle.Light,
                default: Haptics.ImpactFeedbackStyle.Medium,
              }),
          );
        }
      },
      notification: (type?: Haptics.NotificationFeedbackType) => {
        if (haptics) {
          void Haptics.notificationAsync(type);
        }
      },
      selection: () => {
        if (haptics) {
          void Haptics.selectionAsync();
        }
      },
    }),
    [haptics],
  );
};

// ====== MODERATION ======

export const useProfileModeration = (
  profile:
    | app.bsky.actor.defs.ProfileViewBasic
    | app.bsky.actor.defs.ProfileView
    | app.bsky.actor.defs.ProfileViewDetailed,
) => {
  const { _ } = useLingui();
  return useMemo(() => {
    let blur = false;

    // very simple - doesn't take into account user moderation prefs
    // basically, if any of the labels are in the list, blur the profile/banner
    // separately, we should label the profile

    if (profile.labels) {
      for (const label of profile.labels) {
        if (
          [
            "porn",
            "sexual",
            "nudity",
            "nsfl",
            "corpse",
            "gore",
            "torture",
            "self-harm",
            "intolerant-race",
            "intolerant-gender",
            "intolerant-sexual",
            "intolerant-religion",
            "intolerant",
            "icon-intolerant",
            "threat",
            "spam",
            "impersonation",
            "scam",
          ].includes(label.val)
        ) {
          blur = true;
          break;
        }
      }
    }

    return { blur };
  }, [profile]);
};

// ====== LEGACY MODERATION ======

export const useContentFilter = () => {
  const preferences = usePreferences();

  const contentFilter = useCallback(
    (labels?: com.atproto.label.defs.Label[]): FilterResult => {
      if (!labels || labels.length === 0) return null;
      if (!preferences.data) return null;

      let warn: FilterResult = null;

      const adultContentPref = preferences.data?.find((x) =>
        isType(app.bsky.actor.defs.adultContentPref, x),
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

        const pref = preferences.data
          .filter((x) => isType(app.bsky.actor.defs.contentLabelPref, x))
          .find((prefs) => prefs.label === foundLabel.key);

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
    [preferences.dataUpdatedAt, preferences.data],
  );

  return {
    preferences,
    contentFilter,
  };
};
