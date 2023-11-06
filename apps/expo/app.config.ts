// eslint-disable-next-line import/consistent-type-specifier-style -- EAS can't understand this (???)
import type { ConfigContext, ExpoConfig } from "@expo/config";
import dotenv from "dotenv";

import { version } from "./package.json";

dotenv.config({
  path: "../../.env",
});

const defineConfig = (_: ConfigContext): ExpoConfig => ({
  name: "Graysky",
  slug: "graysky",
  scheme: "graysky",
  version,
  owner: process.env.OWNER ?? "mozzius",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/graysky.png",
    resizeMode: "cover",
    backgroundColor: "#888888",
  },
  updates: {
    fallbackToCacheTimeout: 0,
    url: "https://u.expo.dev/7e8ff69c-ba23-4bd8-98ce-7b61b05766c4",
  },
  runtimeVersion: {
    policy: "sdkVersion",
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
    eas: process.env.EAS_PROJECT_ID
      ? {
          projectId: process.env.EAS_PROJECT_ID,
        }
      : undefined,
    revenueCat: {
      ios: process.env.REVENUECAT_API_KEY_IOS,
      android: process.env.REVENUECAT_API_KEY_ANDROID,
    },
    sentry: process.env.SENTRY_DSN,
  },
  hooks: {
    postPublish: process.env.SENTRY_AUTH_TOKEN
      ? [
          {
            file: "sentry-expo/upload-sourcemaps",
            config: {
              organization: "graysky",
              project: "graysky",
            },
          },
        ]
      : undefined,
  },
  experiments: {
    tsconfigPaths: true,
    typedRoutes: false, // too much string interpolation :(
  },
  plugins: [
    "./expo-plugins/with-modify-gradle.js",
    "expo-build-properties",
    "expo-localization",
    "sentry-expo",
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
    ["expo-notifications", { color: "#333333" }],
  ],
});

export default defineConfig;
