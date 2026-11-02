import { defineConfig } from "@lingui/cli";
import { formatter } from "@lingui/format-po";

export default defineConfig({
  locales: [
    "en",
    "ja",
    "es",
    "fr",
    "de",
    "be",
    "pt",
    "nl",
    "cs",
    "ml",
    "uk",
    "ar",
    "hr",
  ],
  sourceLocale: "en",
  catalogs: [
    {
      path: "<rootDir>/src/i18n/locales/{locale}/messages",
      include: ["src"],
    },
  ],
  format: formatter(),
});
