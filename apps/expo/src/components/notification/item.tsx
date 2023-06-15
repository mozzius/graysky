import { View } from "react-native";
import { useTheme } from "@react-navigation/native";

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
  const theme = useTheme();
  return (
    <View
      className="flex-row border-b p-2"
      style={{
        backgroundColor: unread
          ? theme.dark
            ? "rgb(11,20,50)"
            : "rgb(239,246,255)"
          : theme.dark
          ? "black"
          : "white",
        borderBottomColor: unread
          ? theme.dark
            ? "rgb(46,67,136)"
            : "rgb(191,219,254)"
          : theme.colors.border,
      }}
    >
      <View className="w-16 shrink-0 grow-0 items-end px-2">{left}</View>
      <View className="flex-1 pl-1 pr-2">{children}</View>
    </View>
  );
};
