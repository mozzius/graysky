import { Text, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { AtSign, User } from "lucide-react-native";

import { SettingsList } from "../_layout";
import { Avatar } from "../../../components/avatar";
import { useAuthedAgent } from "../../../lib/agent";

const options = [
  {
    title: "Edit Profile",
    href: "/settings/account/edit-bio",
    icon: User,
  },
  {
    title: "Change Handle",
    href: "/settings/account/change-handle",
    icon: AtSign,
  },
];

export default function AccountSettings() {
  const agent = useAuthedAgent();
  const theme = useTheme();
  return (
    <SettingsList options={options}>
      <View className="flex-row items-center border-b border-neutral-200 px-4 py-3 dark:border-neutral-800">
        <Avatar size="large" />
        <View className="ml-4">
          <Text style={{ color: theme.colors.text }} className="text-xs">
            Email:
          </Text>
          <Text
            style={{ color: theme.colors.text }}
            className="text-base font-medium"
          >
            {agent?.session?.email}
          </Text>
        </View>
      </View>
    </SettingsList>
  );
}
