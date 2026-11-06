import { type ReactElement, type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { type useRouter } from "expo-router";
import { type useTheme } from "expo-router/react-navigation";
import {
  type ListItemProps,
  type TextInputProps,
  type UniversalTextStyle,
} from "@expo/ui";

import {
  type FormCustomRow,
  type FormIcon,
  type FormLinkRow,
  type FormPickerRow,
  type FormScrollEvent,
  type FormToggleRow,
} from "./types";

export type Modifiers = NonNullable<ListItemProps["modifiers"]>;

export interface RowContext {
  theme: ReturnType<typeof useTheme>;
  router: ReturnType<typeof useRouter>;
  /** per row modifiers, e.g. the row background on iOS */
  rowModifiers: Modifiers;
  /** android: which picker row's menu is open, by row id */
  openMenu: string | null;
  setOpenMenu: (id: string | null) => void;
}

/** the bits shared by every `ListItem`-like row */
export interface RowBase {
  /** unique within the form */
  id: string;
  /** the headline. on iOS this is a `Label` with the icon */
  title: ReactElement;
  /** android only - iOS puts the icon in the title */
  leading?: ReactElement;
}

export type TitleTone = "text" | "primary" | "destructive";

export interface TitleProps {
  title: string;
  subtitle?: string;
  /** iOS only: the icon or leading content, shown in the `Label`'s icon slot */
  leading?: ReactElement;
  tone?: TitleTone;
}

/** what goes into the universal `ListItem` for a link row */
export interface LinkRowParts {
  onPress?: () => void;
  trailing?: ReactNode;
  supportingText?: ReactNode;
  modifiers: Modifiers;
}

/**
 * Everything the shared form needs from `platform.ios.tsx` (SwiftUI) and
 * `platform.tsx` (Jetpack Compose). The row builders return elements rather
 * than being components, because on Android `FieldGroup.Section` only styles
 * a row as a connected list item when the element it gets is a `ListItem`
 */
export interface FormPlatform {
  /** whether the row icon goes in the `ListItem` leading slot */
  iconInLeadingSlot: boolean;
  FormHost: (props: {
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
  }) => ReactElement;
  useGroupModifiers: (
    onScroll?: (evt: FormScrollEvent) => void,
  ) => Modifiers | undefined;
  rowModifiers: (theme: RowContext["theme"]) => Modifiers;
  Title: (props: TitleProps) => ReactElement;
  RowIcon: (props: { icon: FormIcon; destructive?: boolean }) => ReactElement;
  Spinner: () => ReactElement;
  linkRowParts: (
    row: FormLinkRow,
    onPress: (() => void) | undefined,
    ctx: RowContext,
  ) => LinkRowParts;
  buttonRowModifiers: (
    row: { disabled?: boolean },
    enabled: boolean,
    ctx: RowContext,
  ) => Modifiers;
  /** adds the row's `longPress`. on Android it's part of `linkRowParts` */
  withLongPress: (
    element: ReactElement,
    row: FormLinkRow,
    id: string,
    ctx: RowContext,
  ) => ReactElement;
  toggleRow: (row: FormToggleRow, base: RowBase, ctx: RowContext) => ReactNode;
  pickerRow: (row: FormPickerRow, base: RowBase, ctx: RowContext) => ReactNode;
  customRow: (row: FormCustomRow, id: string, ctx: RowContext) => ReactNode;
  /** a section holding the form's `header` */
  headerSection: (header: ReactElement, ctx: RowContext) => ReactNode;
  /** modifiers for hosted RN content in a footer */
  hostedModifiers: Modifiers;
  footerTextStyle?: UniversalTextStyle;
  textField: (
    ctx: RowContext,
  ) => Pick<TextInputProps, "placeholderTextColor" | "textStyle" | "modifiers">;
}
