import {
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useColorScheme } from "nativewind";

import { cx } from "../lib/utils/cx";

interface TabsProps extends React.PropsWithChildren {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const Tabs = ({ children, className, style }: TabsProps) => {
  return (
    <View
      className={cx(
        "w-full flex-row border-b border-neutral-300 bg-white dark:border-neutral-600 dark:bg-black",
        className,
      )}
      style={style}
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
  const { colorScheme } = useColorScheme();
  const textStyle =
    colorScheme === "light"
      ? {
          active: "text-black",
          inactive: "text-neutral-600",
        }
      : {
          active: "text-white",
          inactive: "text-neutral-400",
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
