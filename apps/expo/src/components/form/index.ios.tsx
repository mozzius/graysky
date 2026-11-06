import { useEffect, useRef, type ReactElement } from "react";
import { PlatformColor } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import {
  Button,
  Host,
  HStack,
  Image,
  Label,
  LabeledContent,
  Picker,
  ProgressView,
  RNHostView,
  Section,
  SecureField,
  Spacer,
  Form as SwiftUIForm,
  Text,
  TextField,
  Toggle,
  VStack,
  type SecureFieldRef,
  type TextFieldRef,
} from "@expo/ui/swift-ui";
import {
  accessibilityAddTraits,
  accessibilityHint,
  accessibilityLabel,
  autocorrectionDisabled,
  disabled,
  font,
  foregroundStyle,
  frame,
  keyboardType,
  lineLimit,
  listRowBackground,
  listRowInsets,
  pickerStyle,
  scrollContentBackground,
  tag,
  textContentType,
  textInputAutocapitalization,
  tint,
  useScrollGeometryChange,
  type ModifierConfig,
} from "@expo/ui/swift-ui/modifiers";

import { iOSVersion } from "~/lib/utils/version";
import { formIcons } from "./icons.ios";
import {
  rowKey,
  sectionKey,
  visibleRows,
  visibleSections,
  type FormButtonRow,
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

const NO_INSETS = { top: 0, leading: 0, bottom: 0, trailing: 0 };

export function Form({ sections, header, onScroll, style }: FormProps) {
  const theme = useTheme();

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

  const rowBackground = listRowBackground(theme.colors.card);

  return (
    <Host
      style={[{ flex: 1 }, style]}
      colorScheme={theme.dark ? "dark" : "light"}
    >
      <SwiftUIForm
        modifiers={[
          scrollContentBackground("hidden"),
          tint(theme.colors.primary),
          ...(scrollModifier ? [scrollModifier] : []),
        ]}
      >
        {header && (
          <Section>
            <HostedRow modifiers={[listRowBackground("clear")]}>
              {header}
            </HostedRow>
          </Section>
        )}
        {visibleSections(sections).map((section, index) => (
          <Section
            key={sectionKey(section, index)}
            title={section.title}
            footer={
              !section.footer ? undefined : typeof section.footer ===
                "string" ? (
                <Text>{section.footer}</Text>
              ) : (
                <RNHostView matchContents={{ vertical: true }}>
                  {section.footer}
                </RNHostView>
              )
            }
          >
            {visibleRows(section.rows).map((row) => (
              <RowView
                key={rowKey(row)}
                row={row}
                modifiers={[rowBackground]}
              />
            ))}
          </Section>
        ))}
      </SwiftUIForm>
    </Host>
  );
}

interface RowProps<T extends FormRow> {
  row: T;
  modifiers: ModifierConfig[];
}

function RowView({ row, modifiers }: RowProps<FormRow>) {
  switch (row.type) {
    case "button":
      return <ButtonRowView row={row} modifiers={modifiers} />;
    case "toggle":
      return <ToggleRowView row={row} modifiers={modifiers} />;
    case "picker":
      return <PickerRowView row={row} modifiers={modifiers} />;
    case "textField":
      return <TextFieldRowView row={row} modifiers={modifiers} />;
    case "custom":
      return <CustomRowView row={row} modifiers={modifiers} />;
    default:
      return <LinkRowView row={row} modifiers={modifiers} />;
  }
}

const iconModifiers = [font({ textStyle: "body" })];

function RowLabel({
  title,
  icon,
  destructive,
}: {
  title: string;
  icon?: FormIcon;
  destructive?: boolean;
}) {
  const theme = useTheme();
  const color = destructive ? "red" : theme.colors.text;
  const text = <Text modifiers={[foregroundStyle(color)]}>{title}</Text>;
  if (!icon) return text;
  return (
    <Label
      icon={
        <Image
          systemName={formIcons[icon]}
          color={destructive ? "red" : theme.colors.primary}
          // expo/ui's Image defaults to a 24pt font without one, much bigger
          // than a native list row icon. body matches the label and follows
          // dynamic type
          modifiers={iconModifiers}
        />
      }
    >
      {text}
    </Label>
  );
}

function LinkRowView({ row, modifiers }: RowProps<FormLinkRow>) {
  const theme = useTheme();
  const router = useRouter();

  const onPress = row.href
    ? () => router.push(row.href!)
    : row.onPress
      ? () => void row.onPress?.()
      : undefined;
  const chevron = row.chevron ?? !!row.href;

  const traits = [
    ...(row.accessibilityRole === "link" ? (["isLink"] as const) : []),
    ...(row.selected ? (["isSelected"] as const) : []),
  ];

  const content = (
    <HStack>
      <RowLabel
        title={row.title}
        icon={row.icon}
        destructive={row.destructive}
      />
      <Spacer />
      {row.value !== undefined && (
        <Text
          modifiers={[
            foregroundStyle(PlatformColor("secondaryLabel")),
            lineLimit(1),
          ]}
        >
          {row.value}
        </Text>
      )}
      {row.selected && (
        <Image
          systemName="checkmark"
          color={theme.colors.primary}
          modifiers={[font({ size: 16, weight: "semibold" })]}
        />
      )}
      {row.accessory === "plus" && (
        <Image systemName="plus" color={theme.colors.primary} />
      )}
      {row.accessory === "copy" && (
        <Image systemName="doc.on.doc" color={theme.colors.text} />
      )}
      {row.accessory === "loading" && <ProgressView />}
      {chevron && (
        <Image
          systemName="chevron.right"
          color={PlatformColor("tertiaryLabel")}
          modifiers={[font({ size: 14, weight: "semibold" })]}
        />
      )}
    </HStack>
  );

  const rowModifiers = [
    ...modifiers,
    ...(row.disabled ? [disabled()] : []),
    ...(traits.length > 0 ? [accessibilityAddTraits(traits)] : []),
  ];

  if (!onPress) {
    return <VStack modifiers={rowModifiers}>{content}</VStack>;
  }

  return (
    <Button onPress={onPress} modifiers={rowModifiers}>
      {content}
    </Button>
  );
}

function ButtonRowView({ row, modifiers }: RowProps<FormButtonRow>) {
  if (row.loading) {
    return (
      <HStack modifiers={modifiers}>
        <Spacer />
        <ProgressView />
        <Spacer />
      </HStack>
    );
  }

  return (
    <Button
      label={row.title}
      role={row.destructive ? "destructive" : undefined}
      onPress={() => void row.onPress()}
      modifiers={[...modifiers, ...(row.disabled ? [disabled()] : [])]}
    />
  );
}

function ToggleRowView({ row, modifiers }: RowProps<FormToggleRow>) {
  const label = <RowLabel title={row.title} icon={row.icon} />;

  if (row.loading) {
    return (
      <LabeledContent label={label} modifiers={modifiers}>
        <ProgressView />
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
      {label}
    </Toggle>
  );
}

function PickerRowView({ row, modifiers }: RowProps<FormPickerRow>) {
  const label = <RowLabel title={row.title} icon={row.icon} />;

  if (row.loading) {
    return (
      <LabeledContent label={label} modifiers={modifiers}>
        <ProgressView />
      </LabeledContent>
    );
  }

  return (
    <Picker
      label={label}
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

function TextFieldRowView({ row, modifiers }: RowProps<FormTextFieldRow>) {
  const ref = useRef<TextFieldRef & SecureFieldRef>(null);
  // the fields are uncontrolled, so push changes made in JS (e.g. lowercasing)
  const nativeText = useRef("");

  useEffect(() => {
    if (row.value !== nativeText.current) {
      nativeText.current = row.value;
      void ref.current?.setText(row.value);
    }
  }, [row.value]);

  const onTextChange = (text: string) => {
    nativeText.current = text;
    row.onChangeText(text);
  };

  const fieldModifiers = [
    ...modifiers,
    ...(row.textContentType === "emailAddress"
      ? [keyboardType("email-address")]
      : []),
    ...(row.autoCapitalize === "none"
      ? [textInputAutocapitalization("never"), autocorrectionDisabled()]
      : []),
    ...(row.textContentType ? [textContentType(row.textContentType)] : []),
    ...(row.disabled ? [disabled()] : []),
    ...(row.accessibilityLabel
      ? [accessibilityLabel(row.accessibilityLabel)]
      : []),
  ];

  if (row.secure) {
    return (
      <SecureField
        ref={ref}
        placeholder={row.placeholder}
        maxLength={row.maxLength}
        autoFocus={row.autoFocus}
        onTextChange={onTextChange}
        modifiers={fieldModifiers}
      />
    );
  }

  return (
    <TextField
      ref={ref}
      placeholder={row.placeholder}
      maxLength={row.maxLength}
      autoFocus={row.autoFocus}
      onTextChange={onTextChange}
      modifiers={fieldModifiers}
    />
  );
}

function CustomRowView({ row, modifiers }: RowProps<FormCustomRow>) {
  return <HostedRow modifiers={modifiers}>{row.children}</HostedRow>;
}

// RN content filling the row edge to edge
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
