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
import { useTheme } from "expo-router/react-navigation";
import {
  AtSignIcon,
  BanIcon,
  BellRingIcon,
  ChevronRightIcon,
  HeartIcon,
  LanguagesIcon,
  ListPlusIcon,
  LockIcon,
  MailIcon,
  MegaphoneOffIcon,
  NewspaperIcon,
  SearchIcon,
  SendIcon,
  ShieldIcon,
  SmartphoneIcon,
  StarIcon,
  UserIcon,
  UserXIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react-native";

import { cx } from "~/lib/utils/cx";
import { ItemSeparator } from "../item-separator";
import {
  rowKey,
  sectionKey,
  type FormCustomRow,
  type FormIcon,
  type FormLinkRow,
} from "./types";

const icons: Record<FormIcon, LucideIcon> = {
  star: StarIcon,
  person: UserIcon,
  shield: ShieldIcon,
  newspaper: NewspaperIcon,
  languages: LanguagesIcon,
  smartphone: SmartphoneIcon,
  bell: BellRingIcon,
  at: AtSignIcon,
  mail: MailIcon,
  lock: LockIcon,
  "person-remove": UserXIcon,
  block: BanIcon,
  mute: MegaphoneOffIcon,
  heart: HeartIcon,
  send: SendIcon,
  wrench: WrenchIcon,
  "list-plus": ListPlusIcon,
  search: SearchIcon,
};

// value/selected/accessory aren't implemented here
type FallbackLinkRow = Omit<FormLinkRow, "value" | "selected" | "accessory">;
type FallbackRow = FallbackLinkRow | FormCustomRow;

export interface FallbackSection {
  key?: string;
  title?: string;
  rows: (FallbackRow | false | null | undefined)[];
}

interface FallbackFormProps extends ScrollViewProps {
  sections: (FallbackSection | false | null | undefined)[];
}

/**
 * Plain RN version of `Form`, for screens where a native form doesn't fit
 * (e.g. inside other scrolling/keyboard-avoiding content). Only supports
 * link and custom rows
 */
export function FallbackForm({ sections, style, ...props }: FallbackFormProps) {
  const theme = useTheme();
  return (
    <ScrollView
      className={cx(
        "flex-1",
        Platform.select({ android: "px-0 pt-4", default: "px-4" }),
      )}
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
      {sections
        .filter((section): section is FallbackSection => !!section)
        .map((section, i, arr) => (
          <View
            key={sectionKey(section, i)}
            className={cx(
              "mt-2 flex-1",
              i === arr.length - 1 ? "mb-16" : "mb-4",
            )}
          >
            {section.title && (
              <Text className="mx-4 mb-1.5 mt-4 text-xs uppercase text-neutral-500">
                {section.title}
              </Text>
            )}
            <View
              style={{
                backgroundColor: theme.colors.card,
                borderCurve: "continuous",
              }}
              className={cx(
                "flex-1 overflow-hidden",
                Platform.select({
                  android: "rounded-none",
                  default: "rounded-2xl",
                }),
              )}
            >
              {section.rows
                .filter((row): row is FallbackRow => !!row)
                .map((row, j, rows) => (
                  <Fragment key={rowKey(row)}>
                    {row.type === "custom" ? (
                      row.children
                    ) : (
                      <LinkRow row={row} />
                    )}
                    {Platform.select({
                      android: true,
                      default: j !== rows.length - 1,
                    }) && (
                      <ItemSeparator
                        iconWidth={
                          row.type !== "custom" && row.icon ? "w-6" : undefined
                        }
                      />
                    )}
                  </Fragment>
                ))}
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

function LinkRow({ row }: { row: FallbackLinkRow }) {
  const theme = useTheme();
  const Icon = row.icon && icons[row.icon];
  const color = row.destructive ? "#ef4444" : theme.colors.text;

  const content = (
    <View
      style={{ backgroundColor: theme.colors.card }}
      className={cx(
        "flex-row items-center px-4",
        Platform.select({
          default: "min-h-[46px] py-1.5",
          android: "min-h-[48px] py-2",
        }),
        row.disabled && "opacity-50",
      )}
    >
      {Icon && (
        <Icon
          color={row.destructive ? "#ef4444" : theme.colors.primary}
          className="mr-3 w-6"
        />
      )}
      <Text style={{ color }} className="mr-3 flex-1 text-base">
        {row.title}
      </Text>
      {(row.chevron ?? !!row.href) && (
        <ChevronRightIcon size={20} className="ml-0.5 text-neutral-500" />
      )}
    </View>
  );

  if (row.disabled) return content;

  if (row.href) {
    return (
      <Link asChild href={row.href}>
        <TouchableHighlight accessibilityRole={row.accessibilityRole}>
          {content}
        </TouchableHighlight>
      </Link>
    );
  }

  if (row.onPress) {
    return (
      <TouchableHighlight
        onPress={row.onPress}
        accessibilityRole={row.accessibilityRole}
      >
        {content}
      </TouchableHighlight>
    );
  }

  return content;
}
