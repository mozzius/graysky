import { AtSign, Ban, Smartphone, User } from "lucide-react-native";

import { GroupedList, Groups } from "../../components/grouped-list";

const groups = [
  {
    options: [
      {
        title: "Account",
        href: "/settings/account",
        icon: User,
      },
      {
        title: "Moderation",
        href: "/settings/moderation",
        icon: Ban,
      },
      {
        title: "App Settings",
        href: "/settings/app",
        icon: Smartphone,
      },
    ],
  },
  {
    options: [
      {
        title: "About Graysky",
        href: "/settings/about",
        icon: AtSign,
      },
    ],
  },
] satisfies Groups;

export default function SettingsPage() {
  return (
    <GroupedList groups={groups} contentInsetAdjustmentBehavior="automatic" />
  );
}
