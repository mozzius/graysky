// eslint-disable-next-line import/consistent-type-specifier-style -- EAS can't understand this (???)
import type { ConfigContext, ExpoConfig } from "@expo/config";
import dotenv from "dotenv";

import { version } from "./package.json";

dotenv.config({
  path: "../../.env",
});

// todo: https://docs.expo.dev/build-reference/variables/#how-to-upload-a-secret-file-and-use-it-in-my-app-config

const defineConfig = (_: ConfigContext): ExpoConfig => ({
  name: "Graysky",
  slug: "graysky",
  scheme: "graysky",
  version,
  owner: "mozzius",
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
    bundleIdentifier: "dev.mozzius.graysky",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      // should be true but simulator builds don't like this
      // TODO: figure out if a simulator build - however local builds don't give env vars indicating this
      UIViewControllerBasedStatusBarAppearance: true,
      // UIViewControllerBasedStatusBarAppearance: false,
      CADisableMinimumFrameDurationOnPhone: true,
    },
  },
  android: {
    package: "dev.mozzius.graysky",
    softwareKeyboardLayoutMode: "pan",
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
  ],
});

export default defineConfig;
