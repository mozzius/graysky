import { Platform } from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { useTheme } from "@react-navigation/native";

interface Props {
  modal?: boolean;
}

export const StatusBar = ({ modal }: Props) => {
  const theme = useTheme();

  if (modal && Platform.OS === "ios" && !Platform.isPad) {
    return <ExpoStatusBar style="light" />;
  } else {
    return (
      <ExpoStatusBar
        style={theme.dark ? "light" : "dark"}
        backgroundColor={theme.colors.card}
      />
    );
  }
};
