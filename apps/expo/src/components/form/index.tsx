import { useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter } from "expo-router";
import { useTheme } from "expo-router/react-navigation";
import {
  FieldGroup,
  ListItem,
  RNHostView,
  Text,
  TextInput,
  useNativeState,
  type TextInputProps,
} from "@expo/ui";

import { platform as P } from "./platform";
import { type RowBase, type RowContext } from "./platform-api";
import {
  rowKey,
  sectionKey,
  visibleRows,
  visibleSections,
  type FormButtonRow,
  type FormLinkRow,
  type FormProps,
  type FormRow,
  type FormTextFieldRow,
} from "./types";

export * from "./types";
export { useFormRowInset } from "./row-inset";

// One implementation on @expo/ui's universal FieldGroup: SwiftUI `Form` on
// iOS, a Material 3 connected list on Android. What the universal API can't
// express lives in `platform.ios.tsx` / `platform.tsx`
export function Form({ sections, header, onScroll, style }: FormProps) {
  const theme = useTheme();
  const router = useRouter();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const groupModifiers = P.useGroupModifiers(onScroll);

  const ctx: RowContext = {
    theme,
    router,
    rowModifiers: P.rowModifiers(theme),
    openMenu,
    setOpenMenu,
  };

  return (
    <P.FormHost style={style}>
      <FieldGroup modifiers={groupModifiers}>
        {header && P.headerSection(header, ctx)}
        {visibleSections(sections).map((section, index) => {
          const key = sectionKey(section, index);
          return (
            <FieldGroup.Section key={key} title={section.title}>
              {/* rows are built by functions, not components - see platform-api.ts */}
              {visibleRows(section.rows).map((row) =>
                renderRow(row, `${key}-${rowKey(row)}`, ctx),
              )}
              {section.footer && (
                <FieldGroup.SectionFooter>
                  {typeof section.footer === "string" ? (
                    <Text textStyle={P.footerTextStyle}>{section.footer}</Text>
                  ) : (
                    <RNHostView
                      matchContents={{ vertical: true }}
                      modifiers={P.hostedModifiers}
                    >
                      {section.footer}
                    </RNHostView>
                  )}
                </FieldGroup.SectionFooter>
              )}
            </FieldGroup.Section>
          );
        })}
      </FieldGroup>
    </P.FormHost>
  );
}

function renderRow(row: FormRow, id: string, ctx: RowContext) {
  switch (row.type) {
    case "button":
      return buttonRow(row, id, ctx);
    case "toggle":
      return P.toggleRow(row, rowBase(row, id), ctx);
    case "picker":
      return P.pickerRow(row, rowBase(row, id), ctx);
    case "textField":
      return <TextFieldRow key={id} row={row} ctx={ctx} />;
    case "custom":
      return P.customRow(row, id, ctx);
    default:
      return linkRow(row, id, ctx);
  }
}

function rowBase(
  row: {
    title: string;
    icon?: FormLinkRow["icon"];
    destructive?: boolean;
    subtitle?: string;
    leading?: ReactElement;
  },
  id: string,
): RowBase {
  const tone = row.destructive ? "destructive" : "text";
  const leading = row.leading ? (
    <RNHostView matchContents>{row.leading}</RNHostView>
  ) : row.icon ? (
    <P.RowIcon icon={row.icon} destructive={row.destructive} />
  ) : undefined;

  return {
    id,
    title: (
      <P.Title
        title={row.title}
        subtitle={row.subtitle}
        tone={tone}
        leading={P.iconInLeadingSlot ? undefined : leading}
      />
    ),
    leading: P.iconInLeadingSlot ? leading : undefined,
  };
}

function linkRow(row: FormLinkRow, id: string, ctx: RowContext) {
  const onPress = row.disabled
    ? undefined
    : row.href
      ? () => ctx.router.push(row.href!)
      : row.onPress
        ? () => void row.onPress?.()
        : undefined;
  const base = rowBase(row, id);
  const parts = P.linkRowParts(row, onPress, ctx);

  const item = (
    <ListItem
      key={id}
      onPress={parts.onPress}
      leading={base.leading}
      trailing={parts.trailing}
      supportingText={parts.supportingText}
      modifiers={parts.modifiers}
    >
      {base.title}
    </ListItem>
  );

  return row.longPress && !row.disabled
    ? P.withLongPress(item, row, id, ctx)
    : item;
}

function buttonRow(row: FormButtonRow, id: string, ctx: RowContext) {
  const enabled = !row.disabled && !row.loading;

  return (
    <ListItem
      key={id}
      onPress={enabled ? () => void row.onPress() : undefined}
      trailing={row.loading ? <P.Spinner /> : undefined}
      modifiers={P.buttonRowModifiers(row, enabled, ctx)}
    >
      <P.Title
        title={row.title}
        tone={row.destructive ? "destructive" : "primary"}
      />
    </ListItem>
  );
}

const AUTO_COMPLETE: Record<
  NonNullable<FormTextFieldRow["textContentType"]>,
  NonNullable<TextInputProps["autoComplete"]>
> = {
  username: "username",
  password: "password",
  newPassword: "new-password",
  emailAddress: "email",
  oneTimeCode: "one-time-code",
};

function TextFieldRow({
  row,
  ctx,
}: {
  row: FormTextFieldRow;
  ctx: RowContext;
}) {
  const text = useNativeState(row.value);
  // the native state only flows one way, so push changes made in JS
  // (e.g. lowercasing) back into the field
  const nativeText = useRef(row.value);

  useEffect(() => {
    if (row.value !== nativeText.current) {
      nativeText.current = row.value;
      text.set(row.value);
    }
  }, [row.value, text]);

  return (
    <TextInput
      {...P.textField(ctx)}
      value={text}
      onChangeText={(value) => {
        nativeText.current = value;
        row.onChangeText(value);
      }}
      placeholder={row.placeholder}
      secureTextEntry={row.secure}
      autoCapitalize={row.autoCapitalize}
      autoCorrect={row.autoCapitalize === "none" ? false : undefined}
      keyboardType={
        row.textContentType === "emailAddress" ? "email-address" : undefined
      }
      autoComplete={
        row.textContentType ? AUTO_COMPLETE[row.textContentType] : undefined
      }
      maxLength={row.maxLength}
      autoFocus={row.autoFocus}
      editable={!row.disabled}
      accessibilityLabel={row.accessibilityLabel}
      cursorColor={ctx.theme.colors.primary}
    />
  );
}
