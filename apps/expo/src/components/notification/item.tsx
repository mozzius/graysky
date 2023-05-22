import { View } from "react-native";
import { TouchableWithoutFeedback } from "react-native-gesture-handler";
import { Link } from "expo-router";
import { StyledComponent } from "nativewind";

import { cx } from "../../lib/utils/cx";

export const NotificationItem = ({
  left = null,
  children,
  unread,
  href,
}: {
  left?: React.ReactNode;
  children: React.ReactNode;
  unread: boolean;
  href?: string;
}) => {
  const className = cx(
    "flex-row border-b p-2 text-black dark:text-white",
    unread
      ? "border-blue-200 bg-blue-50 dark:bg-neutral-800 dark:border-neutral-600"
      : "border-neutral-200 bg-white dark:bg-black dark:border-neutral-800",
  );
  const wrapper = (children: React.ReactNode) =>
    href ? (
      <Link href={href} asChild accessibilityHint="Opens post">
        <StyledComponent
          component={TouchableWithoutFeedback}
          className={className}
        >
          {children}
        </StyledComponent>
      </Link>
    ) : (
      <View className={className}>{children}</View>
    );
  return wrapper(
    <>
      <View className="w-16 shrink-0 items-end px-2">{left}</View>
      <View className="flex-1 px-2">{children}</View>
    </>,
  );
};
