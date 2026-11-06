import { type ReactElement } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { type Href } from "expo-router";

/**
 * Row icons. Mapped to SF Symbols on iOS and Material Symbols on Android,
 * see `icons.ios.ts` and `icons.ts`
 */
export type FormIcon =
  | "star"
  | "person"
  | "shield"
  | "newspaper"
  | "languages"
  | "smartphone"
  | "bell"
  | "at"
  | "mail"
  | "lock"
  | "person-remove"
  | "block"
  | "mute"
  | "heart"
  | "send"
  | "wrench"
  | "list-plus"
  | "search";

interface BaseRow {
  /** defaults to the title */
  key?: string;
  title: string;
  icon?: FormIcon;
  disabled?: boolean;
}

/**
 * A pressable (or static, if there's no `href` or `onPress`) row.
 * `href` pushes with expo-router
 */
export interface FormLinkRow extends BaseRow {
  type?: "link";
  href?: Href;
  onPress?: () => void | Promise<void>;
  /** secondary text on the trailing side */
  value?: string;
  /** "primary" colours `value` with the accent colour, for a row whose press
   * is an action named by the value, e.g. "Sign out" */
  valueTone?: "secondary" | "primary";
  /** defaults to true for `href` rows. iOS only - not a material pattern */
  chevron?: boolean;
  /** shows a checkmark */
  selected?: boolean;
  accessory?: "plus" | "copy" | "loading";
  destructive?: boolean;
  accessibilityRole?: "link" | "button";
  /** a second, secondary line under the title */
  subtitle?: string;
  /**
   * RN content in place of the icon, e.g. an avatar. it's measured, so give
   * it a fixed size
   */
  leading?: ReactElement;
  /**
   * a secondary action. a long click on Android. on iOS it's the one item
   * in the row's context menu, hence the label
   */
  longPress?: {
    label: string;
    destructive?: boolean;
    onPress: () => void;
  };
}

/** an action, styled as a button rather than a navigation row */
export interface FormButtonRow {
  type: "button";
  key?: string;
  title: string;
  onPress: () => void | Promise<void>;
  destructive?: boolean;
  disabled?: boolean;
  /** replaces the button with a spinner */
  loading?: boolean;
}

export interface FormToggleRow extends BaseRow {
  type: "toggle";
  value: boolean;
  onValueChange: (value: boolean) => void;
  /** replaces the switch with a spinner */
  loading?: boolean;
  accessibilityHint?: string;
}

export interface FormPickerOption {
  value: string;
  label: string;
  subtitle?: string;
}

/** single choice from a menu */
export interface FormPickerRow extends BaseRow {
  type: "picker";
  value: string;
  options: FormPickerOption[];
  onValueChange: (value: string) => void;
  /** replaces the picker with a spinner */
  loading?: boolean;
}

export interface FormTextFieldRow {
  type: "textField";
  key: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  autoCapitalize?: "none" | "sentences";
  textContentType?:
    "username" | "password" | "newPassword" | "emailAddress" | "oneTimeCode";
  maxLength?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
}

/**
 * Escape hatch for RN content. Rendered edge to edge with no insets,
 * so the content should bring its own padding
 */
export interface FormCustomRow {
  type: "custom";
  key: string;
  children: ReactElement;
}

export type FormRow =
  | FormLinkRow
  | FormButtonRow
  | FormToggleRow
  | FormPickerRow
  | FormTextFieldRow
  | FormCustomRow;

/** falsy rows are skipped, so you can do `cond && { ... }` */
export type FormRows = (FormRow | false | null | undefined)[];

export interface FormSection {
  /** defaults to the title, then the index */
  key?: string;
  title?: string;
  /**
   * an element is treated as RN content. it's inset to line up with the
   * rows, so don't give it horizontal padding
   */
  footer?: string | ReactElement | false | null;
  rows: FormRows;
}

/** falsy sections are skipped, so you can do `cond && { ... }` */
export type FormSections = (FormSection | false | null | undefined)[];

/** what `TransparentHeaderUntilScrolled` reads from a scroll event */
export interface FormScrollEvent {
  nativeEvent: { contentOffset: { x: number; y: number } };
}

export interface FormProps {
  sections: FormSections;
  /** RN content above the first section, with no background. lines up with the rows */
  header?: ReactElement;
  /** iOS 18+ - also fires once on mount on older versions */
  onScroll?: (evt: FormScrollEvent) => void;
  style?: StyleProp<ViewStyle>;
}

export const visibleSections = (sections: FormSections) =>
  sections.filter((section): section is FormSection => !!section);

export const visibleRows = (rows: FormRows) =>
  rows.filter((row): row is FormRow => !!row);

export const rowKey = (row: FormRow) =>
  row.type === "textField" || row.type === "custom"
    ? row.key
    : (row.key ?? row.title);

export const sectionKey = (section: FormSection, index: number) =>
  section.key ?? section.title ?? String(index);
