import { Text } from "react-native";
import { Ban, Smartphone, User } from "lucide-react-native";

import { SettingsList } from "./_layout";

const options = [
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
];
export default function SettingsPage() {
  return (
    <>
      <Text className="p-4 pt-4 text-center text-2xl font-bold dark:text-white">
        WIP - not much to see here yet
      </Text>
      <SettingsList options={options} />
    </>
  );
}
