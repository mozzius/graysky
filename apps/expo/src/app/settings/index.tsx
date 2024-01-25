import { useMemo } from "react";
import { View } from "react-native";
import {
  AtSignIcon,
  LanguagesIcon,
  NewspaperIcon,
  ShieldIcon,
  SmartphoneIcon,
  StarIcon,
  UserIcon,
} from "lucide-react-native";

import { GroupedList, type Groups } from "~/components/grouped-list";
import { SwitchAccounts } from "~/components/switch-accounts";
import { useOptionalAgent } from "~/lib/agent";
import { useIsPro } from "~/lib/purchases";

export default function SettingsPage() {
  const agent = useOptionalAgent();
  const isPro = useIsPro();

  const groups = useMemo(
    () =>
      [
        {
          options: [
            {
              title: "Graysky Pro",
              href: isPro ? "/settings/pro" : "/pro",
              icon: StarIcon,
            },
          ],
        },
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
              title: "Languages",
              href: "/settings/language",
              icon: LanguagesIcon,
            },
            {
              title: "App settings",
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
      ] satisfies Groups,
    [isPro],
  );

  return (
    <GroupedList groups={groups}>
      <View className="mb-4 flex-1">
        <SwitchAccounts active={agent?.session?.did} showAddAccount />
      </View>
    </GroupedList>
  );
}
