/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { useEffect } from "react";
import { i18n } from "@lingui/core";
import { I18nProvider as DefaultI18nProvider } from "@lingui/react";

import { messages as messagesEn } from "~/i18n/locales/en/messages";
import { messages as messagesJa } from "~/i18n/locales/ja/messages";
import {
  appPreferencesStore,
  useAppLanguage,
  type AppPreferences,
} from "~/lib/storage/app-preferences";

export function languageCodeToName(code: AppPreferences["appLanguage"]) {
  switch (code) {
    case "en": {
      return "English";
    }
    case "ja": {
      return "日本語";
    }
    default:
      throw new Error(`Unknown language code: ${code as string}`);
  }
}

export function languageNameToCode(
  name: ReturnType<typeof languageCodeToName>,
) {
  switch (name) {
    case "English": {
      return "en";
    }
    case "日本語": {
      return "ja";
    }
    default:
      throw new Error(`Unknown language name: ${name as string}`);
  }
}

export function loadAndActivateLanguage(locale: "en" | "ja") {
  switch (locale) {
    case "ja": {
      i18n.loadAndActivate({ locale, messages: messagesJa });
      break;
    }
    default: {
      i18n.loadAndActivate({ locale, messages: messagesEn });
      break;
    }
  }
}

export function initializeI18n() {
  loadAndActivateLanguage(appPreferencesStore.getState().appLanguage);
}

export default function I18nProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const language = useAppLanguage();

  useEffect(() => {
    loadAndActivateLanguage(language);
  }, [language]);

  return <DefaultI18nProvider i18n={i18n}>{children}</DefaultI18nProvider>;
}
