import { useMemo } from "react";
import { View } from "react-native";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
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
  const { _ } = useLingui();

  const groups = useMemo(
    () =>
      [
        {
          options: [
            {
              title: _(msg`Graysky Pro`),
              href: isPro ? "/settings/pro" : "/pro",
              icon: StarIcon,
            },
          ],
        },
        {
          options: [
            {
              title: _(msg`Account`),
              href: "/settings/account",
              icon: UserIcon,
            },
            {
              title: _(msg`Moderation`),
              href: "/settings/moderation",
              icon: ShieldIcon,
            },
            {
              title: _(msg`Home feed preferences`),
              href: "/settings/feed",
              icon: NewspaperIcon,
            },
            {
              title: _(msg`Languages`),
              href: "/settings/language",
              icon: LanguagesIcon,
            },
            {
              title: _(msg`App settings`),
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
                    title: _(msg`Push notifications`),
                    href: "/push-notifications",
                    icon: BellRingIcon,
                  },
                ],
              },
            ]),
        {
          options: [
            {
              title: _(msg`About Graysky`),
              href: "/settings/about",
              icon: AtSignIcon,
            },
          ],
        },
      ] satisfies Groups,
    [isPro, enableNotifications, _],
  );

  return (
    <GroupedList groups={groups}>
      <View className="mb-4 flex-1">
        <SwitchAccounts active={agent?.session?.did} showAddAccount />
      </View>
    </GroupedList>
  );
}
