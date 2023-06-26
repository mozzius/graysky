import "react-native-gesture-handler";
import "./src/lib/utils/polyfills/platform-polyfills";

// import { Platform, StatusBar } from "react-native";
import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";

import { configureRevenueCat } from "./src/lib/hooks/purchases";

// // https://github.com/expo/expo/issues/3874

// StatusBar.setBarStyle("dark-content");

// if (Platform.OS === "android") {
//   StatusBar.setTranslucent(true);
//   StatusBar.setBackgroundColor("transparent");
// }

configureRevenueCat();

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context("./src/app");
  return <ExpoRoot context={ctx} />;
}

registerRootComponent(App);
