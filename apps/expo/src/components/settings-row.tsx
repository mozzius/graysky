import { View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { ChevronRight, type LucideIcon } from "lucide-react-native";

import { cx } from "../lib/utils/cx";

interface Props {
  icon?: LucideIcon;
  children?: React.ReactNode;
  chevron?: boolean;
  action?: React.ReactNode;
}

export const SettingsRow = ({ children, icon, chevron, action }: Props) => {
  const Icon = icon;
  const theme = useTheme();
  return (
    <View
      style={{ backgroundColor: theme.colors.card }}
      className="flex-row items-center px-4 py-3"
    >
      {Icon && <Icon size={24} color={theme.colors.primary} />}
      <View className={cx("mr-3 flex-1", icon && "ml-3")}>{children}</View>
      {chevron && (
        <ChevronRight
          size={20}
          className="text-neutral-400 dark:text-neutral-200"
        />
      )}
      {action}
    </View>
  );
};
