import { View } from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { AtSign, Ban, Smartphone, User } from "lucide-react-native";

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

  {
    title: "About Graysky",
    href: "/settings/about",
    icon: AtSign,
  },
];
export default function SettingsPage() {
  const headerHeight = useHeaderHeight();
  return (
    <View style={{ paddingTop: headerHeight + 16 }} className="flex-1">
      <SettingsList options={options} />
    </View>
  );
}
