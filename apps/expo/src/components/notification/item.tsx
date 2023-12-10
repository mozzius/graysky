import { View } from "react-native";
import { useTheme } from "@react-navigation/native";

import { cx } from "~/lib/utils/cx";

export const NotificationItem = ({
  left = null,
  children,
  unread,
}: {
  left?: React.ReactNode;
  children: React.ReactNode;
  unread: boolean;
}) => {
  const theme = useTheme();
  return (
    <View
      className={cx(
        "flex-row border-b p-2",
        unread
          ? theme.dark
            ? "border-slate-600 bg-slate-800"
            : "border-blue-200 bg-blue-50"
          : theme.dark
            ? "bg-black"
            : "bg-white",
      )}
      style={{ borderColor: unread ? undefined : theme.colors.border }}
    >
      <View className="w-16 shrink-0 grow-0 items-end px-2">{left}</View>
      <View className="flex-1 pl-1 pr-2">{children}</View>
    </View>
  );
};
