// the Jetpack Compose side of the form, see `platform-api.ts`.
// the theme colours are plain strings from react-navigation's themes
import { type ReactElement } from "react";
import { useTheme } from "expo-router/react-navigation";
import { FieldGroup, Icon, ListItem, RNHostView, Text } from "@expo/ui";
import {
  CircularProgressIndicator,
  Text as ComposeText,
  DropdownMenu,
  DropdownMenuItem,
  Host,
  Switch,
} from "@expo/ui/jetpack-compose";
import {
  alpha,
  combinedClickable,
  fillMaxWidth,
  imePadding,
  selectable,
  size,
  toggleable,
} from "@expo/ui/jetpack-compose/modifiers";

import { addIcon, checkIcon, copyIcon, formIcons } from "./icons";
import {
  type FormPlatform,
  type RowContext,
  type TitleProps,
} from "./platform-api";
import { FormRowInsetContext } from "./row-inset";
import { type FormPickerRow } from "./types";

const DESTRUCTIVE = "#ef4444";
const SECONDARY = "#737373";
const DISABLED_ALPHA = 0.38;

type Rgba = `#${string}`;

// `FieldGroup` and its rows take their colours from the Material palette, so
// point the roles it uses at the app theme: the list background, the row
// background, and the text on them
function FormHost({
  style,
  children,
}: Parameters<FormPlatform["FormHost"]>[0]) {
  const theme = useTheme();
  return (
    <Host
      style={[{ flex: 1, backgroundColor: theme.colors.background }, style]}
      colorScheme={theme.dark ? "dark" : "light"}
      seedColor={theme.colors.primary}
      colorOverrides={{
        primary: theme.colors.primary as Rgba,
        surface: theme.colors.background as Rgba,
        surfaceContainer: theme.colors.card as Rgba,
        onSurface: theme.colors.text as Rgba,
        onSurfaceVariant: SECONDARY,
      }}
    >
      {children}
    </Host>
  );
}

const groupModifiers = [imePadding()];

function Title({ title, tone = "text" }: TitleProps) {
  const theme = useTheme();
  return (
    <Text
      textStyle={{
        color:
          tone === "destructive"
            ? DESTRUCTIVE
            : tone === "primary"
              ? (theme.colors.primary as string)
              : (theme.colors.text as string),
        fontWeight: tone === "text" ? undefined : "500",
      }}
    >
      {title}
    </Text>
  );
}

function RowIcon({
  icon,
  destructive,
}: Parameters<FormPlatform["RowIcon"]>[0]) {
  const theme = useTheme();
  return (
    <Icon
      name={formIcons[icon]}
      size={24}
      color={destructive ? DESTRUCTIVE : theme.colors.primary}
    />
  );
}

function Spinner() {
  const theme = useTheme();
  return (
    <CircularProgressIndicator
      color={theme.colors.primary}
      modifiers={[size(24, 24)]}
    />
  );
}

// a dropdown anchored to the selected value, opened by tapping the row.
// compose has no inline picker
function PickerMenu({
  row,
  id,
  ctx,
}: {
  row: FormPickerRow;
  id: string;
  ctx: RowContext;
}) {
  const { theme } = ctx;
  const selected = row.options.find((option) => option.value === row.value);

  return (
    <DropdownMenu
      expanded={ctx.openMenu === id}
      onDismissRequest={() => ctx.setOpenMenu(null)}
      color={theme.colors.card}
    >
      <DropdownMenu.Trigger>
        <ComposeText color={SECONDARY}>{selected?.label ?? ""}</ComposeText>
      </DropdownMenu.Trigger>
      <DropdownMenu.Items>
        {row.options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              ctx.setOpenMenu(null);
              if (option.value !== row.value) row.onValueChange(option.value);
            }}
          >
            <DropdownMenuItem.Text>
              <ComposeText color={theme.colors.text}>
                {option.label}
              </ComposeText>
            </DropdownMenuItem.Text>
            {option.subtitle && (
              <DropdownMenuItem.SupportingText>
                <ComposeText color={SECONDARY}>{option.subtitle}</ComposeText>
              </DropdownMenuItem.SupportingText>
            )}
            {option.value === row.value && (
              <DropdownMenuItem.TrailingIcon>
                <Icon name={checkIcon} size={20} color={theme.colors.primary} />
              </DropdownMenuItem.TrailingIcon>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenu.Items>
    </DropdownMenu>
  );
}

export const platform: FormPlatform = {
  iconInLeadingSlot: true,
  FormHost,
  useGroupModifiers: () => groupModifiers,
  rowModifiers: () => [],
  Title,
  RowIcon,
  Spinner,

  // material: the value is supporting text (or trailing, if there's a
  // subtitle), and there are no chevrons
  linkRowParts: (row, onPress, { theme }) => {
    const longPress = row.longPress && !row.disabled ? row.longPress : null;
    const primaryValue = row.valueTone === "primary";
    // an accent value is an action label, so it stays trailing even without a
    // subtitle to take the supporting text slot
    const valueTrailing =
      row.value !== undefined && (row.subtitle !== undefined || primaryValue);

    return {
      // a row with `selected` is one option of a group, so it's `selectable`.
      // a long press needs `combinedClickable` instead of plain `clickable`
      onPress: row.selected === undefined && !longPress ? onPress : undefined,
      supportingText: row.subtitle ?? (valueTrailing ? undefined : row.value),
      trailing:
        row.accessory === "loading" ? (
          <Spinner />
        ) : row.selected || row.accessory ? (
          <Icon
            name={
              row.accessory === "plus"
                ? addIcon
                : row.accessory === "copy"
                  ? copyIcon
                  : checkIcon
            }
            size={24}
            color={
              row.accessory === "copy"
                ? theme.colors.text
                : theme.colors.primary
            }
          />
        ) : valueTrailing ? (
          primaryValue ? (
            <Text
              textStyle={{
                color: theme.colors.primary as string,
                fontWeight: "500",
              }}
            >
              {row.value}
            </Text>
          ) : (
            row.value
          )
        ) : undefined,
      modifiers: [
        ...(longPress
          ? [
              combinedClickable({
                onClick: onPress,
                onLongClick: longPress.onPress,
              }),
            ]
          : onPress && row.selected !== undefined
            ? [selectable(row.selected, onPress)]
            : []),
        ...(row.disabled ? [alpha(DISABLED_ALPHA)] : []),
      ],
    };
  },

  withLongPress: (element) => element,

  buttonRowModifiers: (row) => (row.disabled ? [alpha(DISABLED_ALPHA)] : []),

  // the whole row toggles, and the switch just shows the state
  toggleRow: (row, base, { theme }) => (
    <ListItem
      key={base.id}
      leading={base.leading}
      trailing={
        row.loading ? (
          <Spinner />
        ) : (
          <Switch
            value={row.value}
            enabled={!row.disabled}
            colors={{ checkedTrackColor: theme.colors.primary }}
          />
        )
      }
      modifiers={[
        toggleable(row.value, () => row.onValueChange(!row.value), {
          role: "switch",
          enabled: !row.disabled && !row.loading,
        }),
        ...(row.disabled ? [alpha(DISABLED_ALPHA)] : []),
      ]}
    >
      {base.title}
    </ListItem>
  ),

  pickerRow: (row, base, ctx) => {
    const enabled = !row.disabled && !row.loading;
    return (
      <ListItem
        key={base.id}
        onPress={enabled ? () => ctx.setOpenMenu(base.id) : undefined}
        leading={base.leading}
        supportingText={<PickerMenu row={row} id={base.id} ctx={ctx} />}
        trailing={row.loading ? <Spinner /> : undefined}
        modifiers={row.disabled ? [alpha(DISABLED_ALPHA)] : []}
      >
        {base.title}
      </ListItem>
    );
  },

  // FieldGroup.Section puts anything that isn't a ListItem inside one, so
  // this gets the list item's padding. tell the content, so it doesn't add
  // its own on top
  customRow: (row, id) => (
    <RNHostView
      key={id}
      matchContents={{ vertical: true }}
      modifiers={[fillMaxWidth()]}
    >
      <FormRowInsetContext.Provider value>
        {row.children}
      </FormRowInsetContext.Provider>
    </RNHostView>
  ),

  // in the header slot of an empty section, so it has no row background
  headerSection: (header: ReactElement) => (
    <FieldGroup.Section key="__form-header">
      <FieldGroup.SectionHeader>
        <RNHostView
          matchContents={{ vertical: true }}
          modifiers={[fillMaxWidth()]}
        >
          {header}
        </RNHostView>
      </FieldGroup.SectionHeader>
    </FieldGroup.Section>
  ),

  hostedModifiers: [fillMaxWidth()],
  footerTextStyle: { color: SECONDARY, fontSize: 14 },

  textField: ({ theme }) => ({
    placeholderTextColor: SECONDARY,
    textStyle: { color: theme.colors.text as string, fontSize: 16 },
    modifiers: [fillMaxWidth()],
  }),
};
