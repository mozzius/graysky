import { View } from "react-native";

import { cx } from "../lib/utils/cx";

interface Props {
  iconWidth?: string;
  containerClassName?: string;
}

export const ItemSeparator = ({ iconWidth, containerClassName }: Props) => (
  <View className={cx("flex-row pl-4", containerClassName)}>
    {iconWidth && <View className={cx(iconWidth, "mr-3 shrink-0")} />}
    <View className="h-px flex-1 bg-neutral-200 dark:bg-neutral-800" />
  </View>
);
