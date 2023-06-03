import { View } from "react-native";

import { cx } from "../lib/utils/cx";

interface Props {
  iconWidth?: string;
  className?: string;
}

export const ItemSeparator = ({ iconWidth, className }: Props) => (
  <View className={cx("flex-row bg-white pl-4 dark:bg-black", className)}>
    {iconWidth && <View className={cx(iconWidth, "mr-3 shrink-0")} />}
    <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
  </View>
);
