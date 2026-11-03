import { useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import {
  CircularProgressIndicator,
  DropdownMenu,
  DropdownMenuItem,
  HorizontalDivider,
  Host,
  Icon,
  LazyColumn,
  ListItem,
  RNHostView,
  Switch,
  Text,
  TextField,
  type TextFieldRef,
} from "@expo/ui/jetpack-compose";
import {
  alpha,
  clickable,
  fillMaxWidth,
  imePadding,
  padding,
  selectable,
  semantics,
  size,
  toggleable,
  type ModifierConfig,
} from "@expo/ui/jetpack-compose/modifiers";

import { addIcon, checkIcon, copyIcon, formIcons } from "./icons";
import {
  rowKey,
  sectionKey,
  visibleRows,
  visibleSections,
  type FormCustomRow,
  type FormIcon,
  type FormLinkRow,
  type FormPickerRow,
  type FormProps,
  type FormRow,
  type FormTextFieldRow,
  type FormToggleRow,
} from "./types";

export * from "./types";

const DESTRUCTIVE = "#ef4444";
const SECONDARY = "#737373";
const DISABLED_ALPHA = 0.38;

// a material settings list - full width rows, primary coloured section
// headers and dividers between sections
export function Form({ sections, header, style }: FormProps) {
  const theme = useTheme();

  return (
    <Host
      style={[{ flex: 1, backgroundColor: theme.colors.card }, style]}
      colorScheme={theme.dark ? "dark" : "light"}
    >
      <LazyColumn
        contentPadding={{ top: 8, bottom: 64 }}
        modifiers={[imePadding()]}
      >
        {header && <HostedRow>{header}</HostedRow>}
        {visibleSections(sections).map((section, index) => [
          index > 0 && (
            <HorizontalDivider
              key={`${sectionKey(section, index)}-divider`}
              modifiers={[padding(0, 8, 0, 8)]}
            />
          ),
          section.title && (
            <Text
              key={`${sectionKey(section, index)}-title`}
              color={theme.colors.primary}
              style={{ typography: "titleSmall" }}
              modifiers={[padding(16, 16, 16, 8)]}
            >
              {section.title}
            </Text>
          ),
          ...visibleRows(section.rows).map((row) => (
            <RowView
              key={`${sectionKey(section, index)}-${rowKey(row)}`}
              row={row}
            />
          )),
          section.footer &&
            (typeof section.footer === "string" ? (
              <Text
                key={`${sectionKey(section, index)}-footer`}
                color={SECONDARY}
                style={{ typography: "bodyMedium" }}
                modifiers={[padding(16, 8, 16, 8)]}
              >
                {section.footer}
              </Text>
            ) : (
              <HostedRow key={`${sectionKey(section, index)}-footer`}>
                {section.footer}
              </HostedRow>
            )),
        ])}
      </LazyColumn>
    </Host>
  );
}

function RowView({ row }: { row: FormRow }) {
  switch (row.type) {
    case "toggle":
      return <ToggleRowView row={row} />;
    case "picker":
      return <PickerRowView row={row} />;
    case "textField":
      return <TextFieldRowView row={row} />;
    case "custom":
      return <CustomRowView row={row} />;
    default:
      return <LinkRowView row={row} />;
  }
}

function useListItemColors() {
  const theme = useTheme();
  return {
    containerColor: theme.colors.card,
    contentColor: theme.colors.text,
    leadingContentColor: theme.colors.primary,
    trailingContentColor: theme.colors.text,
    supportingContentColor: SECONDARY,
  };
}

function LeadingIcon({
  icon,
  destructive,
}: {
  icon?: FormIcon;
  destructive?: boolean;
}) {
  const theme = useTheme();
  if (!icon) return null;
  return (
    <ListItem.LeadingContent>
      <Icon
        source={formIcons[icon]}
        size={24}
        tint={destructive ? DESTRUCTIVE : theme.colors.primary}
      />
    </ListItem.LeadingContent>
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

function LinkRowView({ row }: { row: FormLinkRow }) {
  const theme = useTheme();
  const router = useRouter();
  const colors = useListItemColors();

  const onPress = row.disabled
    ? undefined
    : row.href
      ? () => router.push(row.href!)
      : row.onPress
        ? () => void row.onPress?.()
        : undefined;

  return (
    <ListItem
      colors={colors}
      modifiers={[
        ...(onPress
          ? [
              row.selected !== undefined
                ? selectable(row.selected, onPress)
                : clickable(onPress),
            ]
          : []),
        ...(row.disabled ? [alpha(DISABLED_ALPHA)] : []),
      ]}
    >
      <ListItem.HeadlineContent>
        <Text color={row.destructive ? DESTRUCTIVE : theme.colors.text}>
          {row.title}
        </Text>
      </ListItem.HeadlineContent>
      {row.value !== undefined && (
        <ListItem.SupportingContent>
          <Text color={SECONDARY} maxLines={1} overflow="ellipsis">
            {row.value}
          </Text>
        </ListItem.SupportingContent>
      )}
      <LeadingIcon icon={row.icon} destructive={row.destructive} />
      {(row.selected || row.accessory) && (
        <ListItem.TrailingContent>
          {row.accessory === "loading" ? (
            <Spinner />
          ) : (
            <Icon
              source={
                row.accessory === "plus"
                  ? addIcon
                  : row.accessory === "copy"
                    ? copyIcon
                    : checkIcon
              }
              size={24}
              tint={
                row.accessory === "copy"
                  ? theme.colors.text
                  : theme.colors.primary
              }
            />
          )}
        </ListItem.TrailingContent>
      )}
    </ListItem>
  );
}

function ToggleRowView({ row }: { row: FormToggleRow }) {
  const theme = useTheme();
  const colors = useListItemColors();
  const enabled = !row.disabled && !row.loading;

  return (
    <ListItem
      colors={colors}
      modifiers={[
        toggleable(row.value, () => row.onValueChange(!row.value), {
          role: "switch",
          enabled,
        }),
        ...(row.disabled ? [alpha(DISABLED_ALPHA)] : []),
      ]}
    >
      <ListItem.HeadlineContent>
        <Text color={theme.colors.text}>{row.title}</Text>
      </ListItem.HeadlineContent>
      <LeadingIcon icon={row.icon} />
      <ListItem.TrailingContent>
        {row.loading ? (
          <Spinner />
        ) : (
          // no onCheckedChange - the row handles the toggling
          <Switch
            value={row.value}
            enabled={!row.disabled}
            colors={{ checkedTrackColor: theme.colors.primary }}
          />
        )}
      </ListItem.TrailingContent>
    </ListItem>
  );
}

// compose has no inline picker, so the row opens a dropdown menu anchored to it
function PickerRowView({ row }: { row: FormPickerRow }) {
  const theme = useTheme();
  const colors = useListItemColors();
  const [expanded, setExpanded] = useState(false);

  const selected = row.options.find((option) => option.value === row.value);
  const enabled = !row.disabled && !row.loading;

  return (
    <DropdownMenu
      expanded={expanded}
      onDismissRequest={() => setExpanded(false)}
      color={theme.colors.card}
      modifiers={[fillMaxWidth()]}
    >
      <DropdownMenu.Trigger>
        <ListItem
          colors={colors}
          modifiers={[
            ...(enabled ? [clickable(() => setExpanded(true))] : []),
            ...(row.disabled ? [alpha(DISABLED_ALPHA)] : []),
          ]}
        >
          <ListItem.HeadlineContent>
            <Text color={theme.colors.text}>{row.title}</Text>
          </ListItem.HeadlineContent>
          {selected && (
            <ListItem.SupportingContent>
              <Text color={SECONDARY}>{selected.label}</Text>
            </ListItem.SupportingContent>
          )}
          <LeadingIcon icon={row.icon} />
          {row.loading && (
            <ListItem.TrailingContent>
              <Spinner />
            </ListItem.TrailingContent>
          )}
        </ListItem>
      </DropdownMenu.Trigger>
      <DropdownMenu.Items>
        {row.options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => {
              setExpanded(false);
              if (option.value !== row.value) row.onValueChange(option.value);
            }}
          >
            <DropdownMenuItem.Text>
              <Text color={theme.colors.text}>{option.label}</Text>
            </DropdownMenuItem.Text>
            {option.subtitle && (
              <DropdownMenuItem.SupportingText>
                <Text color={SECONDARY}>{option.subtitle}</Text>
              </DropdownMenuItem.SupportingText>
            )}
            {option.value === row.value && (
              <DropdownMenuItem.TrailingIcon>
                <Icon
                  source={checkIcon}
                  size={20}
                  tint={theme.colors.primary}
                />
              </DropdownMenuItem.TrailingIcon>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenu.Items>
    </DropdownMenu>
  );
}

function TextFieldRowView({ row }: { row: FormTextFieldRow }) {
  const theme = useTheme();
  const ref = useRef<TextFieldRef>(null);
  // the field is uncontrolled, so push changes made in JS (e.g. lowercasing)
  const nativeText = useRef("");

  useEffect(() => {
    if (row.value !== nativeText.current) {
      nativeText.current = row.value;
      void ref.current?.setText(row.value);
    }
  }, [row.value]);

  return (
    <TextField
      ref={ref}
      singleLine
      autoFocus={row.autoFocus}
      enabled={!row.disabled}
      maxLength={row.maxLength}
      visualTransformation={row.secure ? "password" : "none"}
      keyboardOptions={{
        capitalization: row.autoCapitalize === "none" ? "none" : "sentences",
        autoCorrectEnabled: row.autoCapitalize !== "none" && !row.secure,
        keyboardType: row.secure ? "password" : "text",
      }}
      onValueChange={(text) => {
        nativeText.current = text;
        row.onChangeText(text);
      }}
      colors={{
        focusedContainerColor: theme.colors.card,
        unfocusedContainerColor: theme.colors.card,
        disabledContainerColor: theme.colors.card,
        focusedIndicatorColor: theme.colors.primary,
        cursorColor: theme.colors.primary,
        focusedTextColor: theme.colors.text,
        unfocusedTextColor: theme.colors.text,
        focusedLabelColor: theme.colors.primary,
      }}
      modifiers={[
        fillMaxWidth(),
        padding(16, 8, 16, 8),
        ...(row.accessibilityLabel
          ? [semantics({ contentDescription: row.accessibilityLabel })]
          : []),
        // autofill hints
        ...(row.textContentType === "username" ||
        row.textContentType === "password"
          ? [semantics({ contentType: row.textContentType })]
          : []),
      ]}
    >
      {row.placeholder !== undefined && (
        <TextField.Placeholder>
          <Text>{row.placeholder}</Text>
        </TextField.Placeholder>
      )}
    </TextField>
  );
}

function CustomRowView({ row }: { row: FormCustomRow }) {
  return <HostedRow>{row.children}</HostedRow>;
}

// RN content filling the row edge to edge
function HostedRow({
  children,
  modifiers = [],
}: {
  children: ReactElement;
  modifiers?: ModifierConfig[];
}) {
  return (
    <RNHostView
      matchContents={{ vertical: true }}
      modifiers={[fillMaxWidth(), ...modifiers]}
    >
      {children}
    </RNHostView>
  );
}
