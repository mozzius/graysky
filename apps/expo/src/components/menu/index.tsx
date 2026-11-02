import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "expo-router/react-navigation";
import {
  DropdownMenu,
  DropdownMenuItem,
  HorizontalDivider,
  Host,
  Icon,
  RNHostView,
  Text,
} from "@expo/ui/jetpack-compose";

import {
  visibleGroups,
  type ContextMenuProps,
  type MenuGroups,
  type MenuItem,
  type MenuProps,
  type MenuSubmenu,
} from "./types";

export * from "./types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const checkIcon = require("../../../assets/icons/check.xml") as number;
const chevronIcon =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("../../../assets/icons/chevron-right.xml") as number;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const backIcon = require("../../../assets/icons/arrow-back.xml") as number;

// compose's DropdownMenu has no nested menus, so submenus replace the
// contents of the menu, with a back item at the top
export function Menu({
  groups,
  title,
  onOpen,
  accessibilityLabel,
  style,
  children,
}: MenuProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [path, setPath] = useState<string[]>([]);

  let currentGroups = groups;
  let submenu: MenuSubmenu | undefined;
  for (const key of path) {
    const found = findSubmenu(currentGroups, key);
    if (!found) break;
    submenu = found;
    currentGroups = found.groups;
  }

  const close = () => {
    setExpanded(false);
    setPath([]);
  };

  const onItemPress = (item: MenuItem) => {
    switch (item.type) {
      case "submenu":
        setPath((p) => [...p, item.key]);
        break;
      case "toggle":
        close();
        item.onCheckedChange(!item.checked);
        break;
      default:
        close();
        item.onSelect();
    }
  };

  return (
    <Host
      matchContents
      style={style}
      colorScheme={theme.dark ? "dark" : "light"}
    >
      <DropdownMenu
        expanded={expanded}
        onDismissRequest={close}
        color={theme.colors.card}
      >
        <DropdownMenu.Trigger>
          <RNHostView matchContents>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={accessibilityLabel}
              onPress={() => {
                onOpen?.();
                setExpanded(true);
              }}
            >
              {children}
            </Pressable>
          </RNHostView>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {submenu && (
            <>
              <DropdownMenuItem onClick={() => setPath((p) => p.slice(0, -1))}>
                <DropdownMenuItem.LeadingIcon>
                  <Icon source={backIcon} size={20} tint={theme.colors.text} />
                </DropdownMenuItem.LeadingIcon>
                <DropdownMenuItem.Text>
                  <Text color={theme.colors.text} style={{ fontWeight: "600" }}>
                    {submenu.label}
                  </Text>
                </DropdownMenuItem.Text>
              </DropdownMenuItem>
              <HorizontalDivider />
            </>
          )}
          {visibleGroups(currentGroups, submenu ? undefined : title).map(
            (group, index) => [
              index > 0 && <HorizontalDivider key={`${group.key}-divider`} />,
              group.title && (
                <DropdownMenuItem key={`${group.key}-title`} enabled={false}>
                  <DropdownMenuItem.Text>
                    <Text
                      color={theme.colors.text}
                      style={{ typography: "labelMedium" }}
                    >
                      {group.title}
                    </Text>
                  </DropdownMenuItem.Text>
                </DropdownMenuItem>
              ),
              ...group.items.map((item) => (
                <DropdownMenuItem
                  key={item.key}
                  enabled={!item.disabled}
                  onClick={() => onItemPress(item)}
                >
                  <DropdownMenuItem.Text>
                    <Text
                      color={
                        item.type !== "toggle" &&
                        item.type !== "submenu" &&
                        item.destructive
                          ? theme.colors.notification
                          : theme.colors.text
                      }
                    >
                      {item.type === "toggle" && item.subtitle
                        ? `${item.label}\n${item.subtitle}`
                        : item.label}
                    </Text>
                  </DropdownMenuItem.Text>
                  {item.type === "toggle" && item.checked && (
                    <DropdownMenuItem.TrailingIcon>
                      <Icon
                        source={checkIcon}
                        size={20}
                        tint={theme.colors.primary}
                      />
                    </DropdownMenuItem.TrailingIcon>
                  )}
                  {item.type === "submenu" && (
                    <DropdownMenuItem.TrailingIcon>
                      <Icon
                        source={chevronIcon}
                        size={20}
                        tint={theme.colors.text}
                      />
                    </DropdownMenuItem.TrailingIcon>
                  )}
                </DropdownMenuItem>
              )),
            ],
          )}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}

// long-press menus are an iOS thing - android shows the image as is
export function ContextMenu({ style, children }: ContextMenuProps) {
  return <View style={style}>{children}</View>;
}

function findSubmenu(groups: MenuGroups, key: string) {
  for (const group of visibleGroups(groups)) {
    for (const item of group.items) {
      if (item.type === "submenu" && item.key === key) return item;
    }
  }
}
