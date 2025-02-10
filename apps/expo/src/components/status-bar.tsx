import { Platform } from "react-native";
import { SystemBars } from "react-native-edge-to-edge";
import { useTheme } from "@react-navigation/native";

interface Props {
  modal?: boolean;
}

export const StatusBar = ({ modal }: Props) => {
  const theme = useTheme();

  if (modal && Platform.OS === "ios") {
    if (Platform.isPad) {
      // use whatever the underlying screen is using
      return null;
    } else {
      return <SystemBars style="light" />;
    }
  } else {
    return <SystemBars style={theme.dark ? "light" : "dark"} />;
  }
};
