import {
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useTheme } from "@react-navigation/native";

import { cx } from "../lib/utils/cx";

interface TabsProps extends React.PropsWithChildren {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const Tabs = ({ children, className, style }: TabsProps) => {
  const theme = useTheme();
  return (
    <View
      className={cx(
        "w-full flex-row border-b border-neutral-300 dark:border-neutral-800",
        className,
      )}
      style={[{ backgroundColor: theme.colors.card }, style]}
    >
      {children}
    </View>
  );
};

interface TabProps {
  active: boolean;
  onPress: () => void;
  text: string;
}

export const Tab = ({ active, onPress, text }: TabProps) => {
  const textStyle = {
    active: "text-black dark:text-white",
    inactive: "text-neutral-600 dark:text-neutral-400",
  };

  return (
    <TouchableOpacity
      accessibilityRole="tab"
      onPress={onPress}
      className={cx(
        "ml-4 border-y-2 border-transparent py-3 text-xl",
        active && "border-b-black dark:border-b-white",
      )}
    >
      <Text
        className={cx(
          "px-2 text-sm",
          active ? textStyle.active : textStyle.inactive,
        )}
      >
        {text}
      </Text>
    </TouchableOpacity>
  );
};
