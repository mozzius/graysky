import { Fragment } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TouchableHighlight,
  View,
  type ScrollViewProps,
} from "react-native";
import { Link } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { ChevronRightIcon, type LucideIcon } from "lucide-react-native";

import { cx } from "~/lib/utils/cx";
import { ItemSeparator } from "./item-separator";

interface ListProps {
  options?: (
    | {
        title: string;
        icon?: LucideIcon | "SPACE";
        href?: string;
        onPress?: () => void | Promise<void>;
        action?: React.ReactNode;
        destructive?: boolean;
        accessibilityRole?: "link"; // todo: add more
        chevron?: boolean;
        disabled?: boolean;
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
      style={{ backgroundColor: theme.colors.card, borderCurve: "continuous" }}
      className={cx(
        "overflow-hidden",
        Platform.select({
          android: "rounded-none",
          default: "rounded-lg",
        }),
      )}
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
              chevron={(!!option.href && !option.action) || option.chevron}
              action={option.action}
              destructive={option.destructive}
              disabled={option.disabled}
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
              {option.href && !option.disabled ? (
                <Link asChild href={option.href}>
                  <TouchableHighlight>
                    <View>{row}</View>
                  </TouchableHighlight>
                </Link>
              ) : option.onPress && !option.disabled ? (
                <TouchableHighlight
                  onPress={() => void option.onPress?.()}
                  accessibilityRole={option.accessibilityRole}
                >
                  <View>{row}</View>
                </TouchableHighlight>
              ) : (
                row
              )}
              {Platform.select({
                android: true,
                default: i !== arr.length - 1,
              }) && (
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
      footer?: string;
    })
  | false
  | null
  | undefined
)[];

interface GroupProps extends ScrollViewProps {
  groups: Groups;
  children?: React.ReactNode;
  scrollRef?: React.Ref<ScrollView>;
}

export const GroupedList = ({
  groups,
  children,
  scrollRef,
  style,
  ...props
}: GroupProps) => {
  const theme = useTheme();
  return (
    <ScrollView
      className={cx(
        "flex-1",
        Platform.select({
          android: "px-0 pt-4",
          default: "px-4",
        }),
      )}
      ref={scrollRef}
      contentInsetAdjustmentBehavior="automatic"
      style={[
        {
          backgroundColor: Platform.select({
            ios: "transparent",
            default: theme.colors.card,
          }),
        },
        style,
      ]}
      {...props}
    >
      <View className="mt-2 flex-1">{children}</View>
      {groups
        .filter((x) => !!x)
        .map((group, i, arr) => {
          if (!group) return null;
          const { title, footer, ...list } = group;
          return (
            <View
              key={i}
              className={cx(i === arr.length - 1 ? "mb-16" : "mb-4")}
            >
              {title && (
                <Text className="mx-4 mb-1.5 mt-4 text-xs uppercase text-neutral-500">
                  {title}
                </Text>
              )}
              <ListGroup {...list} />
              {footer && (
                <Text className="mx-4 mt-3 text-sm text-neutral-500">
                  {footer}
                </Text>
              )}
            </View>
          );
        })}
    </ScrollView>
  );
};

interface RowProps {
  icon?: LucideIcon | "SPACE";
  children?: React.ReactNode;
  chevron?: boolean;
  action?: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}

export const Row = ({
  children,
  icon,
  chevron,
  action,
  destructive,
  disabled,
}: RowProps) => {
  const Icon = icon === "SPACE" ? null : icon;
  const theme = useTheme();
  return (
    <View
      style={{ backgroundColor: theme.colors.card }}
      className={cx(
        "flex-row items-center px-4",
        Platform.select({
          default: "min-h-[46px] py-1.5",
          android: "min-h-[48px] py-2",
        }),
      )}
      aria-disabled={disabled}
    >
      {icon &&
        (Icon ? (
          <Icon
            size={24}
            color={destructive ? "#ef4444" : theme.colors.primary}
            className={cx(disabled && "opacity-50")}
          />
        ) : (
          <View style={{ width: 24 }} />
        ))}
      <View
        className={cx("mr-3 flex-1", icon && "ml-3", disabled && "opacity-50")}
      >
        {children}
      </View>
      {action}
      {chevron && (
        <ChevronRightIcon size={20} className="ml-0.5 text-neutral-500" />
      )}
    </View>
  );
};
