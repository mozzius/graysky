import { useMMKVObject } from "react-native-mmkv";
import { Redirect } from "expo-router";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { store } from "~/lib/storage";
import {
  SwitchAccounts,
  type SavedSession,
} from "../../components/switch-accounts";

export default function ResumeSession() {
  const [sessions] = useMMKVObject<SavedSession[]>("sessions", store);

  if (!sessions || sessions.length === 0) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            title: "Log back in",
            children: (
              <SwitchAccounts sessions={sessions} chevrons showAddAccount />
            ),
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
