import { useState } from "react";
import { Pressable, View } from "react-native";
import { useTheme } from "expo-router/react-navigation";
import {
  Box,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPopup,
  Host,
  Icon,
  RNHostView,
  SelectableDropdownMenuItem,
  Spacer,
  Text,
} from "@expo/ui/jetpack-compose";
import { height } from "@expo/ui/jetpack-compose/modifiers";

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

// matches MenuDefaults.GroupSpacing
const groupSpacing = [height(2)];

/**
 * material 3 expressive menu - each group is its own rounded container.
 * compose has no nested menus, so submenus replace the contents of the
 * menu, with a back item at the top
 */
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

  const shown = visibleGroups(currentGroups, submenu ? undefined : title);
  const groupCount = shown.length + (submenu ? 1 : 0);
  const groupOffset = submenu ? 1 : 0;

  return (
    <Host
      matchContents
      style={style}
      colorScheme={theme.dark ? "dark" : "light"}
    >
      <Box>
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
        <DropdownMenuPopup expanded={expanded} onDismissRequest={close}>
          {submenu && (
            <>
              <DropdownMenuGroup
                shapes={{ index: 0, count: groupCount }}
                containerColor={theme.colors.card}
              >
                <DropdownMenuItem
                  shape={{ index: 0, count: 1 }}
                  onClick={() => setPath((p) => p.slice(0, -1))}
                >
                  <DropdownMenuItem.LeadingIcon>
                    <Icon
                      source={backIcon}
                      size={20}
                      tint={theme.colors.text}
                    />
                  </DropdownMenuItem.LeadingIcon>
                  <DropdownMenuItem.Text>
                    <Text
                      color={theme.colors.text}
                      style={{ fontWeight: "600" }}
                    >
                      {submenu.label}
                    </Text>
                  </DropdownMenuItem.Text>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <Spacer modifiers={groupSpacing} />
            </>
          )}
          {shown.map((group, index) => {
            // the title is the group's first row, so it counts for the shape
            const rowCount = group.items.length + (group.title ? 1 : 0);
            const rowOffset = group.title ? 1 : 0;
            return [
              index > 0 && (
                <Spacer key={`${group.key}-spacer`} modifiers={groupSpacing} />
              ),
              <DropdownMenuGroup
                key={group.key}
                shapes={{ index: index + groupOffset, count: groupCount }}
                containerColor={theme.colors.card}
              >
                {group.title && (
                  <DropdownMenuItem
                    shape={{ index: 0, count: rowCount }}
                    enabled={false}
                  >
                    <DropdownMenuItem.Text>
                      <Text
                        color={theme.colors.text}
                        style={{ typography: "labelMedium" }}
                      >
                        {group.title}
                      </Text>
                    </DropdownMenuItem.Text>
                  </DropdownMenuItem>
                )}
                {group.items.map((item, itemIndex) => (
                  <MenuRow
                    key={item.key}
                    item={item}
                    shape={{ index: itemIndex + rowOffset, count: rowCount }}
                    onPress={() => onItemPress(item)}
                  />
                ))}
              </DropdownMenuGroup>,
            ];
          })}
        </DropdownMenuPopup>
      </Box>
    </Host>
  );
}

function MenuRow({
  item,
  shape,
  onPress,
}: {
  item: MenuItem;
  shape: { index: number; count: number };
  onPress: () => void;
}) {
  const theme = useTheme();

  if (item.type === "toggle") {
    return (
      <SelectableDropdownMenuItem
        selected={item.checked}
        shapes={shape}
        enabled={!item.disabled}
        onClick={onPress}
      >
        <SelectableDropdownMenuItem.Text>
          <Text color={theme.colors.text}>{item.label}</Text>
        </SelectableDropdownMenuItem.Text>
        {item.subtitle && (
          <SelectableDropdownMenuItem.SupportingText>
            <Text>{item.subtitle}</Text>
          </SelectableDropdownMenuItem.SupportingText>
        )}
        <SelectableDropdownMenuItem.SelectedLeadingIcon>
          <Icon source={checkIcon} size={20} tint={theme.colors.text} />
        </SelectableDropdownMenuItem.SelectedLeadingIcon>
      </SelectableDropdownMenuItem>
    );
  }

  const textColor =
    item.type !== "submenu" && item.destructive
      ? theme.colors.notification
      : theme.colors.text;

  return (
    <DropdownMenuItem shape={shape} enabled={!item.disabled} onClick={onPress}>
      <DropdownMenuItem.Text>
        <Text color={textColor}>{item.label}</Text>
      </DropdownMenuItem.Text>
      {item.type === "submenu" && (
        <DropdownMenuItem.TrailingIcon>
          <Icon source={chevronIcon} size={20} tint={theme.colors.text} />
        </DropdownMenuItem.TrailingIcon>
      )}
    </DropdownMenuItem>
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
