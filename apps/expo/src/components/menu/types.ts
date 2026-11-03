import { type ReactElement } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import { type ButtonProps } from "@expo/ui/swift-ui";

/** SF Symbol name. iOS only - Android menus don't show item icons */
export type MenuIcon = NonNullable<ButtonProps["systemImage"]>;

interface BaseItem {
  key: string;
  label: string;
  icon?: MenuIcon;
  disabled?: boolean;
}

export interface MenuAction extends BaseItem {
  type?: "action";
  destructive?: boolean;
  onSelect: () => void;
}

export interface MenuToggle extends BaseItem {
  type: "toggle";
  subtitle?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export interface MenuSubmenu extends BaseItem {
  type: "submenu";
  groups: MenuGroups;
}

export type MenuItem = MenuAction | MenuToggle | MenuSubmenu;

export interface MenuGroup {
  key: string;
  title?: string;
  items: MenuItem[];
}

/** falsy groups are skipped, so you can do `cond && { ... }` */
export type MenuGroups = (MenuGroup | false | null | undefined)[];

export interface MenuProps {
  groups: MenuGroups;
  /** shown as a header above the first group */
  title?: string;
  /** android only - swiftui menus don't report opening */
  onOpen?: () => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  /** the trigger. don't make it pressable, the menu handles that */
  children: ReactElement;
}

export interface ContextMenuProps {
  groups: MenuGroups;
  /** shown as a header above the first group */
  title?: string;
  /** layout style for the container - the child should fill it */
  style?: StyleProp<ViewStyle>;
  children: ReactElement;
}

export const visibleGroups = (groups: MenuGroups, title?: string) => {
  const visible = groups.filter((group): group is MenuGroup => !!group);
  if (title && visible[0] && !visible[0].title) {
    visible[0] = { ...visible[0], title };
  }
  return visible;
};
