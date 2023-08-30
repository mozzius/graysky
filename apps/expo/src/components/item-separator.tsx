import { View } from "react-native";
import { useTheme } from "@react-navigation/native";

import { cx } from "~/lib/utils/cx";

interface Props {
  iconWidth?: string;
  containerClassName?: string;
  backgroundColor?: string;
}

export const ItemSeparator = ({
  iconWidth,
  containerClassName,
  backgroundColor,
}: Props) => {
  const theme = useTheme();

  return (
    <View
      className={cx("flex-row pl-4", containerClassName)}
      style={{ backgroundColor }}
    >
      {iconWidth && <View className={cx(iconWidth, "mr-3 shrink-0")} />}
      <View
        className={cx(
          "h-px flex-1",
          theme.dark ? "bg-neutral-800" : "bg-neutral-200",
        )}
      />
    </View>
  );
};
