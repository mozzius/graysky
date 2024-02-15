import { useMemo } from "react";
import { View } from "react-native";
import {
  AtSignIcon,
  BellRingIcon,
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
import { useEnableNotifications } from "~/lib/storage/app-preferences";

export default function SettingsPage() {
  const agent = useOptionalAgent();
  const isPro = useIsPro();
  const enableNotifications = useEnableNotifications();

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
              title: "アカウント",
              href: "/settings/account",
              icon: UserIcon,
            },
            {
              title: "モデレーション",
              href: "/settings/moderation",
              icon: ShieldIcon,
            },
            {
              title: "ホームフィードの設定",
              href: "/settings/feed",
              icon: NewspaperIcon,
            },
            {
              title: "言語",
              href: "/settings/language",
              icon: LanguagesIcon,
            },
            {
              title: "アプリの設定",
              href: "/settings/app",
              icon: SmartphoneIcon,
            },
          ],
        },
        ...(enableNotifications
          ? []
          : [
              {
                options: [
                  {
                    title: "プッシュ通知",
                    href: "/push-notifications",
                    icon: BellRingIcon,
                  },
                ],
              },
            ]),
        {
          options: [
            {
              title: "Grayskyについて",
              href: "/settings/about",
              icon: AtSignIcon,
            },
          ],
        },
      ] satisfies Groups,
    [isPro, enableNotifications],
  );

  return (
    <GroupedList groups={groups}>
      <View className="mb-4 flex-1">
        <SwitchAccounts active={agent?.session?.did} showAddAccount />
      </View>
    </GroupedList>
  );
}
