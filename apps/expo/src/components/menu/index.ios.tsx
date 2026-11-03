import { View } from "react-native";
import { useTheme } from "expo-router/react-navigation";
import {
  Button,
  Host,
  RNHostView,
  Section,
  ContextMenu as SwiftUIContextMenu,
  Menu as SwiftUIMenu,
  Text,
  Toggle,
} from "@expo/ui/swift-ui";
import { disabled } from "@expo/ui/swift-ui/modifiers";

import {
  visibleGroups,
  type ContextMenuProps,
  type MenuGroups,
  type MenuItem,
  type MenuProps,
} from "./types";

export * from "./types";

export function Menu({
  groups,
  title,
  accessibilityLabel,
  style,
  children,
}: MenuProps) {
  const theme = useTheme();

  return (
    <Host
      matchContents
      style={style}
      colorScheme={theme.dark ? "dark" : "light"}
    >
      <SwiftUIMenu
        label={
          <RNHostView matchContents>
            <RNTrigger accessibilityLabel={accessibilityLabel}>
              {children}
            </RNTrigger>
          </RNHostView>
        }
      >
        <MenuContents groups={groups} title={title} />
      </SwiftUIMenu>
    </Host>
  );
}

/** long-press menu. iOS only, on android it just renders the children */
export function ContextMenu({
  groups,
  title,
  style,
  children,
}: ContextMenuProps) {
  const theme = useTheme();

  return (
    <Host style={style} colorScheme={theme.dark ? "dark" : "light"}>
      <SwiftUIContextMenu>
        <SwiftUIContextMenu.Trigger>
          <RNHostView>{children}</RNHostView>
        </SwiftUIContextMenu.Trigger>
        <SwiftUIContextMenu.Items>
          <MenuContents groups={groups} title={title} />
        </SwiftUIContextMenu.Items>
      </SwiftUIContextMenu>
    </Host>
  );
}

// RNHostView wants a single element, and we want the a11y label on it
function RNTrigger({
  accessibilityLabel,
  children,
}: {
  accessibilityLabel?: string;
  children: MenuProps["children"];
}) {
  if (!accessibilityLabel) return children;
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
}

function MenuContents({
  groups,
  title,
}: {
  groups: MenuGroups;
  title?: string;
}) {
  return visibleGroups(groups, title).map((group) => (
    <Section key={group.key} title={group.title}>
      {group.items.map((item) => (
        <MenuItemView key={item.key} item={item} />
      ))}
    </Section>
  ));
}

function MenuItemView({ item }: { item: MenuItem }) {
  const modifiers = item.disabled ? [disabled()] : undefined;

  switch (item.type) {
    case "submenu":
      return (
        <SwiftUIMenu
          label={item.label}
          systemImage={item.icon}
          modifiers={modifiers}
        >
          <MenuContents groups={item.groups} />
        </SwiftUIMenu>
      );
    case "toggle":
      return (
        <Toggle
          isOn={item.checked}
          label={item.subtitle ? undefined : item.label}
          systemImage={item.icon}
          onIsOnChange={item.onCheckedChange}
          modifiers={modifiers}
        >
          {item.subtitle ? (
            <>
              <Text>{item.label}</Text>
              <Text>{item.subtitle}</Text>
            </>
          ) : undefined}
        </Toggle>
      );
    default:
      return (
        <Button
          label={item.label}
          systemImage={item.icon}
          role={item.destructive ? "destructive" : undefined}
          onPress={item.onSelect}
          modifiers={modifiers}
        />
      );
  }
}
