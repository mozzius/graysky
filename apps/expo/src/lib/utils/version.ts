import { Platform } from "react-native";

export const iOSVersion =
  Platform.OS === "ios" ? Number(Platform.Version.split(".")[0]) : 0;
export const isIOS26 = iOSVersion >= 26;
