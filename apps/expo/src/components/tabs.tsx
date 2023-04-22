import { Text, TouchableOpacity, View } from "react-native";

import { cx } from "../lib/utils/cx";

export const Tabs = ({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) => {
  return (
    <View
      className={cx(
        "w-full flex-row border-b border-neutral-200 bg-white",
        className,
      )}
    >
      {children}
    </View>
  );
};

interface Props {
  active: boolean;
  onPress: () => void;
  text: string;
}

export const Tab = ({ active, onPress, text }: Props) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={cx(
        "ml-4 border-y-2 border-transparent py-3 text-xl",
        active && "border-b-black",
      )}
    >
      <Text className="font-medium">{text}</Text>
    </TouchableOpacity>
  );
};
