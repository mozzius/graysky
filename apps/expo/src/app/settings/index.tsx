import {
  AtSignIcon,
  BanIcon,
  SmartphoneIcon,
  UserIcon,
} from "lucide-react-native";

import { GroupedList, Groups } from "~/components/grouped-list";

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
        icon: BanIcon,
      },
      {
        title: "App Settings",
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
  return (
    <GroupedList groups={groups} contentInsetAdjustmentBehavior="automatic" />
  );
}
