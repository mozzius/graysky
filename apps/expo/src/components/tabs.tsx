import {
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { cx } from "../lib/utils/cx";

interface TabsProps extends React.PropsWithChildren {
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export const Tabs = ({ children, className, style }: TabsProps) => {
  return (
    <View
      className={cx(
        "w-full flex-row border-b border-neutral-200 bg-white dark:bg-black",
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
  return (
    <TouchableOpacity
      onPress={onPress}
      className={cx(
        "ml-4 border-y-2 border-transparent py-3 text-xl",
        active && "border-b-black dark:border-b-white",
      )}
    >
      <Text className="font-medium text-neutral-500 dark:text-neutral-50">
        {text}
      </Text>
    </TouchableOpacity>
  );
};
