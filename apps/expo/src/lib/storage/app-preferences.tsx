import { useCallback, useEffect, useMemo } from "react";
import * as Localization from "expo-localization";
import { DarkTheme, DefaultTheme } from "@react-navigation/native";
import { useColorScheme as useNativeWindColorScheme } from "nativewind";
import { z } from "zod";
import { create, useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { produce } from "../utils/produce";
import { store } from "./storage";

export const appPrefsSchema = z.object({
  // feeds
  sortableFeeds: z.boolean().optional().default(false),
  listsAboveFeeds: z.boolean().optional().default(false),
  homepage: z.enum(["feeds", "skyline"]).optional().default("feeds"),
  defaultFeed: z.string().optional().default("following"),
  // language
  primaryLanguage: z
    .string()
    .optional()
    .default(Localization.getLocales()[0]?.languageCode ?? "en"),
  contentLanguages: z
    .array(z.string())
    .optional()
    .default(
      Localization.getLocales()
        .filter((l) => l.languageCode)
        .map((l) => l.languageCode!),
    ),
  mostRecentLanguage: z.string().optional(),
  // misc
  groupNotifications: z.boolean().default(true),
  copiedCodes: z.array(z.string()).default([]),
  haptics: z.boolean().optional().default(true),
  gifAutoplay: z.boolean().optional().default(true),
  inAppBrowser: z.boolean().optional(),
  altText: z.enum(["warn", "hide", "force"]).optional().default("warn"),
  // pro stuff
  translationMethod: z.enum(["GOOGLE", "DEEPL"]).optional().default("DEEPL"),
  colorScheme: z.enum(["system", "light", "dark"]).optional().default("system"),
  accentColor: z.string().optional(),
});

export type AppPreferences = z.infer<typeof appPrefsSchema>;

export const appPreferencesStore = create<AppPreferences>()(
  persist(() => ({ ...appPrefsSchema.parse({}) }), {
    name: "app-prefs",
    storage: createJSONStorage(() => ({
      setItem: (name, value) => store.set(name, value),
      getItem: (name) => store.getString(name) ?? null,
      removeItem: (name) => store.delete(name),
    })),
  }),
);

const createHookName = (str: string) =>
  "use" + str.at(0)?.toUpperCase() + str.slice(1);

function createSelectorHooks() {
  return Object.fromEntries(
    (Object.keys(appPrefsSchema.shape) as (keyof AppPreferences)[]).map(
      (key) => {
        const selector = (s: AppPreferences) => s[key];
        return [
          createHookName(key),
          () => useStore(appPreferencesStore, selector),
        ];
      },
    ),
  ) as Required<{
    [K in keyof AppPreferences as `use${Capitalize<K>}`]: () => AppPreferences[K];
  }>;
}

export const {
  useAltText,
  useColorScheme,
  useContentLanguages,
  useCopiedCodes,
  useDefaultFeed,
  useGifAutoplay,
  useGroupNotifications,
  useHaptics,
  useHomepage,
  useListsAboveFeeds,
  usePrimaryLanguage,
  useSortableFeeds,
  useTranslationMethod,
  useAccentColor,
  useInAppBrowser,
  useMostRecentLanguage,
} = createSelectorHooks();

export const useSetAppPreferences = () => {
  return useCallback((change: Partial<AppPreferences>) => {
    return appPreferencesStore.setState(change);
  }, []);
};

export const useThemeSetup = () => {
  const { colorScheme: currentColorScheme, setColorScheme } =
    useNativeWindColorScheme();
  const accentColor = useAccentColor();
  const colorSchemePreference = useColorScheme();

  const colorScheme = useMemo(() => {
    if (colorSchemePreference === "system") {
      return currentColorScheme;
    } else {
      return colorSchemePreference;
    }
  }, [colorSchemePreference, currentColorScheme]);

  useEffect(() => {
    setColorScheme(colorSchemePreference);
  }, [colorSchemePreference, setColorScheme]);

  return useMemo(() => {
    const base = colorScheme === "dark" ? DarkTheme : DefaultTheme;
    if (accentColor) {
      return produce(base, (draft) => {
        draft.colors.primary = accentColor;
      });
    } else {
      return base;
    }
  }, [colorScheme, accentColor]);
};
