import { useMMKVObject } from "react-native-mmkv";
import { Redirect } from "expo-router";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Form } from "~/components/form";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { store } from "~/lib/storage/storage";
import {
  SwitchAccounts,
  type SavedSession,
} from "../../components/switch-accounts";

export default function ResumeSession() {
  const [sessions] = useMMKVObject<SavedSession[]>("sessions", store);
  const { _ } = useLingui();

  if (!sessions || sessions.length === 0) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <TransparentHeaderUntilScrolled>
      <Form
        sections={[
          {
            title: _(msg`Log back in`),
            rows: [
              {
                type: "custom",
                key: "accounts",
                children: <SwitchAccounts chevrons showAddAccount />,
              },
            ],
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
