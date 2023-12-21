import { MMKV } from "react-native-mmkv";
import * as Localization from "expo-localization";
import { z } from "zod";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { createSelectorHooks } from "./auto-selectors";

const appPrefsSchema = z.object({
  groupNotifications: z.boolean().default(true),
  copiedCodes: z.array(z.string()).default([]),
  haptics: z.boolean().optional().default(true),
  sortableFeeds: z.boolean().optional().default(false),
  listsAboveFeeds: z.boolean().optional().default(false),
  homepage: z.enum(["feeds", "skyline"]).optional().default("feeds"),
  defaultFeed: z.string().optional().default("following"),
  primaryLanguage: z
    .string()
    .optional()
    .default(Localization.getLocales()[0]?.languageCode ?? "en"),
  contentLanguages: z
    .array(z.string())
    .optional()
    .default(Localization.getLocales().map((l) => l.languageCode)),
  mostRecentLanguage: z.string().optional(),
  gifAutoplay: z.boolean().optional().default(true),
  inAppBrowser: z.boolean().optional(),
  altText: z.enum(["warn", "hide", "force"]).optional().default("warn"),
  translationMethod: z.enum(["GOOGLE", "DEEPL"]).optional().default("DEEPL"),
  colorScheme: z.enum(["system", "light", "dark"]).optional().default("system"),
  accentColor: z.string().optional(),
});

export type AppPreferences = z.infer<typeof appPrefsSchema>;

const storage = new MMKV({ id: "app-prefs" });

export const appPreferencesStore = create<AppPreferences>()(
  persist(() => ({ ...appPrefsSchema.parse({}) }), {
    name: "app-preferences",
    storage: createJSONStorage(() => ({
      setItem: (name, value) => storage.set(name, value),
      getItem: (name) => storage.getString(name) ?? null,
      removeItem: (name) => storage.delete(name),
    })),
  }),
);

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
} = createSelectorHooks(appPreferencesStore);
