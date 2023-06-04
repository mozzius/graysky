import { View } from "react-native";

import { cx } from "../../lib/utils/cx";

export const NotificationItem = ({
  left = null,
  children,
  unread,
}: {
  left?: React.ReactNode;
  children: React.ReactNode;
  unread: boolean;
}) => {
  return (
    <View
      className={cx(
        "flex-row border-b p-2 text-black dark:text-white",
        unread
          ? "border-blue-200 bg-blue-50 dark:border-neutral-600 dark:bg-neutral-800"
          : "border-neutral-200 bg-white dark:border-neutral-800 dark:bg-black",
      )}
    >
      <View className="w-16 shrink-0 grow-0 items-end px-2">{left}</View>
      <View className="flex-1 pl-1 pr-2">{children}</View>
    </View>
  );
};
