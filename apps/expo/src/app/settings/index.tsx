import { View } from "react-native";
import { useMMKVObject } from "react-native-mmkv";
import {
  AtSignIcon,
  NewspaperIcon,
  ShieldIcon,
  SmartphoneIcon,
  UserIcon,
} from "lucide-react-native";

import { GroupedList, type Groups } from "~/components/grouped-list";
import {
  SwitchAccounts,
  type SavedSession,
} from "~/components/switch-accounts";
import { useOptionalAgent } from "~/lib/agent";
import { store } from "~/lib/storage";

const groups = [
  {
    options: [
      {
        title: "Account",
        href: "/settings/account",
        icon: UserIcon,
      },
      {
        title: "Moderation",
        href: "/settings/moderation",
        icon: ShieldIcon,
      },
      {
        title: "Home feed preferences",
        href: "/settings/feed",
        icon: NewspaperIcon,
      },
      {
        title: "App preferences",
        href: "/settings/app",
        icon: SmartphoneIcon,
      },
    ],
  },
  {
    options: [
      {
        title: "About Graysky",
        href: "/settings/about",
        icon: AtSignIcon,
      },
    ],
  },
] satisfies Groups;

export default function SettingsPage() {
  const agent = useOptionalAgent();
  const [sessions] = useMMKVObject<SavedSession[]>("sessions", store);

  return (
    <GroupedList groups={groups} contentInsetAdjustmentBehavior="automatic">
      <View className="mb-4 flex-1">
        <SwitchAccounts
          sessions={sessions ?? []}
          active={agent?.session?.did}
        />
      </View>
    </GroupedList>
  );
}
