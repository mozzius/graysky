// eslint-disable-next-line import/consistent-type-specifier-style -- EAS can't understand this (???)
import type { ConfigContext, ExpoConfig } from "@expo/config";

import { version } from "./package.json";

// for development. doesn't override existing vars, same as dotenv did
try {
  process.loadEnvFile("../../.env");
} catch {
  // no .env file (e.g. on EAS)
}

/**
 * atproto oauth redirects use a custom scheme that's the reverse of the oauth
 * client id's host (graysky.app -> app.graysky). keep in sync with
 * packages/api/src/oauth.ts
 */
const oauthRedirectScheme = new URL(
  process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID ||
    "https://graysky.app/oauth-client-metadata.json",
).hostname
  .split(".")
  .reverse()
  .join(".");

const defineConfig = (_: ConfigContext): ExpoConfig => ({
  name: "Graysky",
  slug: "graysky",
  scheme: ["graysky", oauthRedirectScheme],
  version,
  owner: process.env.OWNER ?? "mozzius",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/7e8ff69c-ba23-4bd8-98ce-7b61b05766c4",
  },
  runtimeVersion: {
    policy: "appVersion",
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true,
    bundleIdentifier: process.env.APP_ID ?? "dev.mozzius.graysky",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      // should be true but dev client builds don't like this
      UIViewControllerBasedStatusBarAppearance:
        process.env.DEV_CLIENT === "true" ? false : true,
      CADisableMinimumFrameDurationOnPhone: true,
      UIBackgroundModes: ["remote-notification"],
      // UIDesignRequiresCompatibility: true,
    },
  },
  android: {
    package: process.env.APP_ID ?? "dev.mozzius.graysky",
    softwareKeyboardLayoutMode: "pan",
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#888888",
    },
  },
  extra: {
    eas: {
      projectId:
        process.env.EAS_PROJECT_ID ?? "7e8ff69c-ba23-4bd8-98ce-7b61b05766c4",
    },
    revenueCat: {
      ios: process.env.REVENUECAT_API_KEY_IOS,
      android: process.env.REVENUECAT_API_KEY_ANDROID,
    },
    sentry: process.env.SENTRY_DSN,
    devClient: process.env.DEV_CLIENT === "true",
  },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: false, // too much string interpolation :(
    reactCompiler: true,
  },
  buildCacheProvider: "eas",
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          deploymentTarget: "16.4",
          useFrameworks: "static",
        },
      },
    ],
    [
      // top-level `splash` was removed from the expo config in sdk 58
      "expo-splash-screen",
      {
        // full-bleed cloud photo on ios. without the legacy flag the plugin
        // draws the image as a small square in the middle of the screen
        ios: {
          image: "./assets/graysky.jpg",
          resizeMode: "cover",
          enableFullScreenImage_legacy: true,
          backgroundColor: "#121212",
        },
        // android 12+ splash screens can only show a centred icon
        android: {
          image: "./assets/icon.png",
          imageWidth: 200,
          backgroundColor: "#121212",
        },
      },
    ],
    "expo-localization",
    "react-native-bottom-tabs",
    [
      "@sentry/react-native/expo",
      {
        organization: "graysky",
        project: "graysky",
      },
    ],
    "expo-router",
    [
      "expo-media-library",
      {
        savePhotosPermission:
          "This app accesses your photos to let you save images to your device.",
      },
    ],
    [
      "expo-image-picker",
      {
        photosPermission:
          "This app accesses your photos to let you add images to your posts.",
        cameraPermission:
          "This app accesses your camera to let you add photos from your camera to your posts.",
      },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/icon-notification.png",
        color: "#333333",
      },
    ],
    [
      "expo-quick-actions",
      {
        androidIcons: {
          shortcut_search: {
            foregroundImage: "./assets/adaptive/search_icon.png",
            backgroundColor: "#121212",
          },
          shortcut_compose: {
            foregroundImage: "./assets/adaptive/compose_icon.png",
            backgroundColor: "#121212",
          },
          shortcut_settings: {
            foregroundImage: "./assets/adaptive/settings_icon.png",
            backgroundColor: "#121212",
          },
          shortcut_about: {
            foregroundImage: "./assets/adaptive/info_icon.png",
            backgroundColor: "#121212",
          },
        },
        iosActions: [
          {
            id: "search",
            title: "Search",
            icon: "search",
            params: { href: "/search" },
          },
          {
            id: "new-post",
            title: "New Post",
            icon: "compose",
            params: { href: "/composer" },
          },
          {
            id: "settings",
            title: "Settings",
            icon: "symbol:gearshape",
            params: { href: "/settings" },
          },
          {
            id: "about",
            title: "About",
            icon: "symbol:info.circle",
            params: { href: "/settings/about" },
          },
        ],
      },
    ],
    ["react-native-safari-extension", { folderName: "OpenInGrayskyExtension" }],
  ],
});

export default defineConfig;
