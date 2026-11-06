// the SwiftUI side of the form, see `platform-api.ts`
import { useEffect, useRef, type ReactElement } from "react";
import { PlatformColor } from "react-native";
import { useTheme } from "expo-router/react-navigation";
import { FieldGroup, Host, Icon, RNHostView } from "@expo/ui";
import {
  Button,
  ContextMenu,
  HStack,
  Label,
  LabeledContent,
  Picker,
  ProgressView,
  Text,
  Toggle,
  VStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityAddTraits,
  accessibilityHint,
  accessibilityRemoveTraits,
  buttonStyle,
  disabled,
  font,
  foregroundStyle,
  frame,
  lineLimit,
  listRowBackground,
  listRowInsets,
  pickerStyle,
  scrollContentBackground,
  tag,
  tint,
  useScrollGeometryChange,
  type ModifierConfig,
} from "@expo/ui/swift-ui/modifiers";

import { iOSVersion } from "~/lib/utils/version";
import { formIcons } from "./icons.ios";
import {
  type FormPlatform,
  type Modifiers,
  type RowBase,
  type TitleProps,
} from "./platform-api";
import {
  type FormPickerRow,
  type FormScrollEvent,
  type FormToggleRow,
} from "./types";

const NO_INSETS = { top: 0, leading: 0, bottom: 0, trailing: 0 };

function FormHost({
  style,
  children,
}: Parameters<FormPlatform["FormHost"]>[0]) {
  const theme = useTheme();
  return (
    <Host
      style={[{ flex: 1 }, style]}
      colorScheme={theme.dark ? "dark" : "light"}
    >
      {children}
    </Host>
  );
}

function useGroupModifiers(onScroll?: (evt: FormScrollEvent) => void) {
  const theme = useTheme();

  // FieldGroup is a ScrollView-less SwiftUI Form, so the scroll position
  // comes from a modifier rather than a universal prop
  const scrollModifier = useScrollGeometryChange(
    onScroll
      ? (geometry) =>
          onScroll({
            nativeEvent: {
              contentOffset: {
                x: geometry.contentOffsetX,
                y: geometry.contentOffsetY,
              },
            },
          })
      : undefined,
  );

  // scroll geometry is iOS 18+. tell the header we're scrolled so it isn't
  // stuck transparent with content scrolling under it
  const onScrollRef = useRef(onScroll);
  onScrollRef.current = onScroll;
  useEffect(() => {
    if (iOSVersion < 18) {
      onScrollRef.current?.({ nativeEvent: { contentOffset: { x: 0, y: 0 } } });
    }
  }, []);

  return [
    scrollContentBackground("hidden"),
    tint(theme.colors.primary),
    ...(scrollModifier ? [scrollModifier] : []),
  ];
}

// expo/ui's Image defaults to a 24pt font without one, much bigger than a
// native list row icon. body matches the label and follows dynamic type
const iconModifiers = [font({ textStyle: "body" })];

function RowIcon({
  icon,
  destructive,
}: Parameters<FormPlatform["RowIcon"]>[0]) {
  const theme = useTheme();
  return (
    <Icon
      name={formIcons[icon]}
      color={destructive ? "red" : theme.colors.primary}
      modifiers={iconModifiers}
    />
  );
}

// a `Label` keeps the icons in a column and the separators lined up with
// the text, which an icon in ListItem's leading slot wouldn't
function Title({ title, subtitle, leading, tone = "text" }: TitleProps) {
  const theme = useTheme();
  const color =
    tone === "destructive"
      ? "red"
      : tone === "primary"
        ? theme.colors.primary
        : theme.colors.text;
  const titleText = <Text modifiers={[foregroundStyle(color)]}>{title}</Text>;
  // like a native subtitle cell
  const text =
    subtitle !== undefined ? (
      <VStack alignment="leading" spacing={2}>
        {titleText}
        <Text
          modifiers={[
            font({ textStyle: "subheadline" }),
            foregroundStyle(PlatformColor("secondaryLabel")),
          ]}
        >
          {subtitle}
        </Text>
      </VStack>
    ) : (
      titleText
    );
  if (!leading) return text;
  return <Label icon={leading}>{text}</Label>;
}

// spinners inside a row's Button would otherwise pick up the accent colour
const spinnerModifiers = [tint({ type: "hierarchical", style: "secondary" })];

function Spinner() {
  return <ProgressView modifiers={spinnerModifiers} />;
}

// ListItem is a `.plain` button, which doesn't highlight the row when
// pressed like a native form row does
const pressable = (enabled: boolean) =>
  enabled
    ? [buttonStyle("automatic")]
    : // a static row is still a Button underneath
      [accessibilityRemoveTraits(["isButton"])];

function ToggleRowView({
  row,
  base,
  modifiers,
}: {
  row: FormToggleRow;
  base: RowBase;
  modifiers: Modifiers;
}) {
  if (row.loading) {
    return (
      <LabeledContent label={base.title} modifiers={modifiers}>
        <Spinner />
      </LabeledContent>
    );
  }

  return (
    <Toggle
      isOn={row.value}
      onIsOnChange={row.onValueChange}
      modifiers={[
        ...modifiers,
        // keep the system green rather than the accent colour
        tint("green"),
        ...(row.disabled ? [disabled()] : []),
        ...(row.accessibilityHint
          ? [accessibilityHint(row.accessibilityHint)]
          : []),
      ]}
    >
      {base.title}
    </Toggle>
  );
}

function PickerRowView({
  row,
  base,
  modifiers,
}: {
  row: FormPickerRow;
  base: RowBase;
  modifiers: Modifiers;
}) {
  if (row.loading) {
    return (
      <LabeledContent label={base.title} modifiers={modifiers}>
        <Spinner />
      </LabeledContent>
    );
  }

  return (
    <Picker
      label={base.title}
      selection={row.value}
      onSelectionChange={(value: string) => row.onValueChange(value)}
      modifiers={[
        ...modifiers,
        pickerStyle("menu"),
        ...(row.disabled ? [disabled()] : []),
      ]}
    >
      {row.options.map((option) =>
        option.subtitle ? (
          <VStack key={option.value} modifiers={[tag(option.value)]}>
            <Text>{option.label}</Text>
            <Text>{option.subtitle}</Text>
          </VStack>
        ) : (
          <Text key={option.value} modifiers={[tag(option.value)]}>
            {option.label}
          </Text>
        ),
      )}
    </Picker>
  );
}

// RN content filling the row edge to edge. the universal RNHostView doesn't
// take modifiers on iOS, so the row modifiers go on a wrapper
function HostedRow({
  modifiers,
  children,
}: {
  modifiers: ModifierConfig[];
  children: ReactElement;
}) {
  return (
    <VStack
      modifiers={[
        listRowInsets(NO_INSETS),
        frame({ maxWidth: Infinity }),
        ...modifiers,
      ]}
    >
      <RNHostView matchContents={{ vertical: true }}>{children}</RNHostView>
    </VStack>
  );
}

export const platform: FormPlatform = {
  iconInLeadingSlot: false,
  FormHost,
  useGroupModifiers,
  rowModifiers: (theme) => [listRowBackground(theme.colors.card)],
  Title,
  RowIcon,
  Spinner,

  linkRowParts: (row, onPress, ctx) => {
    const { theme } = ctx;
    const chevron = row.chevron ?? !!row.href;
    const traits = [
      ...(row.accessibilityRole === "link" ? (["isLink"] as const) : []),
      ...(row.selected ? (["isSelected"] as const) : []),
    ];
    const hasTrailing =
      row.value !== undefined || row.selected || row.accessory || chevron;

    return {
      onPress,
      trailing: hasTrailing ? (
        <HStack>
          {row.value !== undefined && (
            <Text
              modifiers={[
                foregroundStyle(
                  row.valueTone === "primary"
                    ? theme.colors.primary
                    : PlatformColor("secondaryLabel"),
                ),
                lineLimit(1),
              ]}
            >
              {row.value}
            </Text>
          )}
          {row.selected && (
            <Icon
              name="checkmark"
              color={theme.colors.primary}
              modifiers={[font({ size: 16, weight: "semibold" })]}
            />
          )}
          {row.accessory === "plus" && (
            <Icon name="plus" color={theme.colors.primary} />
          )}
          {row.accessory === "copy" && (
            <Icon name="doc.on.doc" color={theme.colors.text} />
          )}
          {row.accessory === "loading" && <Spinner />}
          {chevron && (
            <Icon
              name="chevron.right"
              color={PlatformColor("tertiaryLabel")}
              modifiers={[font({ size: 14, weight: "semibold" })]}
            />
          )}
        </HStack>
      ) : undefined,
      modifiers: [
        ...ctx.rowModifiers,
        ...pressable(!!onPress),
        ...(row.disabled ? [disabled()] : []),
        ...(traits.length > 0 ? [accessibilityAddTraits(traits)] : []),
      ],
    };
  },

  // a context menu with the one action. a long press gesture on the row
  // would fight the row's button for the tap
  withLongPress: (element, row, id, ctx) =>
    row.longPress ? (
      <ContextMenu key={id} modifiers={ctx.rowModifiers}>
        <ContextMenu.Items>
          <Button
            label={row.longPress.label}
            role={row.longPress.destructive ? "destructive" : undefined}
            onPress={row.longPress.onPress}
          />
        </ContextMenu.Items>
        <ContextMenu.Trigger>{element}</ContextMenu.Trigger>
      </ContextMenu>
    ) : (
      element
    ),

  buttonRowModifiers: (row, enabled, ctx) => [
    ...ctx.rowModifiers,
    ...pressable(enabled),
    ...(row.disabled ? [disabled()] : []),
  ],

  toggleRow: (row, base, ctx) => (
    <ToggleRowView
      key={base.id}
      row={row}
      base={base}
      modifiers={ctx.rowModifiers}
    />
  ),

  pickerRow: (row, base, ctx) => (
    <PickerRowView
      key={base.id}
      row={row}
      base={base}
      modifiers={ctx.rowModifiers}
    />
  ),

  customRow: (row, id, ctx) => (
    <HostedRow key={id} modifiers={ctx.rowModifiers}>
      {row.children}
    </HostedRow>
  ),

  // a row with no background, so it lines up with the rows below
  headerSection: (header) => (
    <FieldGroup.Section key="__form-header">
      <HostedRow modifiers={[listRowBackground("clear")]}>{header}</HostedRow>
    </FieldGroup.Section>
  ),

  hostedModifiers: [],

  textField: (ctx) => ({ modifiers: ctx.rowModifiers }),
};
