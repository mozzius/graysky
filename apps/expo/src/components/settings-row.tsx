import { View } from "react-native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { cx } from "../lib/utils/cx";

interface Props {
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
  chevron?: boolean;
}

export const SettingsRow = ({ children, className, icon, chevron }: Props) => {
  const { colorScheme } = useColorScheme();
  const color = colorScheme === "light" ? "#000" : "#FFF";
  const Icon = icon;
  return (
    <View
      className={cx(
        (className =
          "w-full flex-row items-center border-b border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-black"),
        className,
      )}
    >
      {Icon && <Icon size={24} color={color} />}
      <View className="mx-4 flex-1">{children}</View>
      {chevron && <ChevronRight size={24} color={color} />}
    </View>
  );
};
