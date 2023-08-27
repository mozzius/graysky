import { Fragment } from "react";
import {
  ScrollView,
  Text,
  TouchableHighlight,
  View,
  type ScrollViewProps,
} from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ChevronRightIcon, type LucideIcon } from "lucide-react-native";

import { cx } from "../lib/utils/cx";
import { ItemSeparator } from "./item-separator";

interface ListProps {
  options?: (
    | {
        title: string;
        icon?: LucideIcon;
        href?: string;
        onPress?: () => void | Promise<void>;
        action?: React.ReactNode;
        destructive?: boolean;
      }
    | undefined
    | null
    | false
  )[];
  children?: React.ReactNode;
}

const ListGroup = ({ children, options = [] }: ListProps) => {
  const theme = useTheme();
  return (
    <View
      style={{ backgroundColor: theme.colors.card }}
      className="overflow-hidden rounded-lg"
    >
      {children}
      {options
        .filter((x) => !!x)
        .map((option, i, arr) => {
          // unreachable
          if (!option) return null;
          const row = (
            <Row
              icon={option.icon}
              chevron={!!option.href && !option.action}
              action={option.action}
              destructive={option.destructive}
            >
              <Text
                style={{
                  color: option.destructive ? "#ef4444" : theme.colors.text,
                }}
                className="text-base"
              >
                {option.title}
              </Text>
            </Row>
          );
          return (
            <Fragment key={option.title}>
              {option.href ? (
                <Link asChild href={option.href}>
                  <TouchableHighlight>
                    <View>{row}</View>
                  </TouchableHighlight>
                </Link>
              ) : option.onPress ? (
                <TouchableHighlight onPress={() => void option.onPress?.()}>
                  <View>{row}</View>
                </TouchableHighlight>
              ) : (
                row
              )}
              {i !== arr.length - 1 && (
                <ItemSeparator iconWidth={option.icon ? "w-6" : undefined} />
              )}
            </Fragment>
          );
        })}
    </View>
  );
};

export type Groups = (
  | (ListProps & {
      title?: string;
    })
  | false
  | null
  | undefined
)[];

interface GroupProps extends ScrollViewProps {
  groups: Groups;
  children?: React.ReactNode;
}

export const GroupedList = ({ groups, children, ...props }: GroupProps) => {
  return (
    <ScrollView className="flex-1 px-4" {...props}>
      <View className="mt-4">{children}</View>
      {groups
        .filter((x) => !!x)
        .map((group, i, arr) => {
          if (!group) return null;
          const { title, ...list } = group;
          return (
            <View key={i} className={i === arr.length - 1 ? "mb-16" : "mb-4"}>
              {title && (
                <Text className="mx-4 mb-1.5 mt-4 text-xs uppercase text-neutral-500">
                  {title}
                </Text>
              )}
              <ListGroup {...list} />
            </View>
          );
        })}
    </ScrollView>
  );
};

interface RowProps {
  icon?: LucideIcon;
  children?: React.ReactNode;
  chevron?: boolean;
  action?: React.ReactNode;
  destructive?: boolean;
}

export const Row = ({
  children,
  icon,
  chevron,
  action,
  destructive,
}: RowProps) => {
  const Icon = icon;
  const theme = useTheme();
  return (
    <View
      style={{ backgroundColor: theme.colors.card }}
      className="flex-row items-center px-4 py-3"
    >
      {Icon && (
        <Icon
          size={24}
          color={destructive ? "#ef4444" : theme.colors.primary}
        />
      )}
      <View className={cx("mr-3 flex-1", icon && "ml-3")}>{children}</View>
      {chevron && (
        <ChevronRightIcon
          size={20}
          className="text-neutral-400 dark:text-neutral-200"
        />
      )}
      {action}
    </View>
  );
};
