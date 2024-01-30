import {
  ScrollView,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { DarkTheme, DefaultTheme, useTheme } from "@react-navigation/native";
import { CheckIcon } from "lucide-react-native";
import colors from "tailwindcss/colors";

import {
  useAccentColor,
  useSetAppPreferences,
} from "~/lib/storage/app-preferences";
import { cx } from "~/lib/utils/cx";

interface Props {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const AccentColourSelect = ({ className, style }: Props) => {
  const accentColor = useAccentColor();
  const setAppPreferences = useSetAppPreferences();
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      className={cx("flex-1 flex-row gap-x-2 px-4 py-2", className)}
      style={style}
    >
      {[
        undefined,
        colors.amber[500],
        colors.red[500],
        colors.purple[500],
        colors.green[500],
        colors.fuchsia[500],
      ].map((color) => (
        <TouchableOpacity
          key={color ?? "default"}
          onPress={() => setAppPreferences({ accentColor: color })}
        >
          <View
            key={color}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{
              backgroundColor:
                color ??
                (theme.dark
                  ? DarkTheme.colors.primary
                  : DefaultTheme.colors.primary),
            }}
          >
            {accentColor === color && <CheckIcon size={20} color="white" />}
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};
