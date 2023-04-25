import type { ExpoConfig } from "@expo/config";

const defineConfig = (): ExpoConfig => ({
  name: "Graysky",
  slug: "graysky",
  scheme: "graysky",
  version: "0.0.5",
  owner: "mozzius",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    image: "./assets/icon.png",
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
      UIViewControllerBasedStatusBarAppearance: true,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#888888",
    },
  },
  // extra: {
  //   eas: {
  //     projectId: "7e8ff69c-ba23-4bd8-98ce-7b61b05766c4",
  //   },
  // },
  plugins: ["./expo-plugins/with-modify-gradle.js"],
});

export default defineConfig;
