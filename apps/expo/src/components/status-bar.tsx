import { Platform } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { useIsFocused, useTheme } from "@react-navigation/native";

interface Props {
  modal?: boolean;
  force?: boolean;
}

export const StatusBar = ({ modal, force }: Props) => {
  const isFocused = useIsFocused();

  if (!isFocused && !force) return null;

  if (modal && Platform.OS === "ios") {
    if (Platform.isPad) {
      // use whatever the underlying screen is using
      return null;
    } else {
      return <SystemBars style="light" />;
    }
  } else {
    return <SystemBars style="auto" />;
  }
};
