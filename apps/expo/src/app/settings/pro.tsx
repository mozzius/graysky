import { useRouter } from "expo-router";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { AccentColourSelect } from "~/components/accent-colour-select";
import { Form } from "~/components/form";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useIsPro } from "~/lib/purchases";
import {
  useSetAppPreferences,
  useTranslationMethod,
} from "~/lib/storage/app-preferences";

export default function ProSettings() {
  const translationMethod = useTranslationMethod();
  const setAppPreferences = useSetAppPreferences();
  const isPro = useIsPro();
  const router = useRouter();
  const { _ } = useLingui();

  if (!isPro) router.back();

  return (
    <TransparentHeaderUntilScrolled>
      <Form
        sections={[
          {
            title: _(msg`Translation provider`),
            rows: [
              {
                type: "toggle",
                title: _(msg`Use DeepL for translations`),
                disabled: !isPro,
                value: translationMethod === "DEEPL",
                onValueChange: (useDeepL) => {
                  setAppPreferences({
                    translationMethod: useDeepL ? "DEEPL" : "GOOGLE",
                  });
                },
                accessibilityHint: _(
                  msg`Use DeepL for translations instead of Google Translate`,
                ),
              },
            ],
            footer: _(msg`Google Translate is used otherwise.`),
          },
          {
            title: _(msg`Accent colour`),
            rows: [
              {
                type: "custom",
                key: "accent-colour",
                children: <AccentColourSelect />,
              },
            ],
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
