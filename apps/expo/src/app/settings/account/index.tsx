import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AtSign, User } from "lucide-react-native";

import { Avatar } from "../../../components/avatar";
import { SettingsRow } from "../../../components/settings-row";
import { useAuthedAgent } from "../../../lib/agent";

const options = [
  {
    title: "Edit Bio",
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

  return (
    <View className="flex-1 dark:border-t dark:border-neutral-700">
      <StatusBar style="light" />
      <ScrollView className="flex-1">
        <View className="w-full border-b border-neutral-200 p-4 dark:border-neutral-700">
          <View className="flex-row items-center rounded-sm border border-neutral-200 bg-white p-4 text-center text-2xl font-bold dark:border-neutral-700 dark:bg-black">
            <Avatar size="large" />
            <View className="ml-4">
              <Text className="text-xs dark:text-white">Email:</Text>
              <Text className="text-base font-medium dark:text-white">
                {agent?.session?.email}
              </Text>
            </View>
          </View>
        </View>
        {options.map((option) => {
          return (
            <Link asChild href={option.href} key={option.title}>
              <TouchableOpacity>
                <SettingsRow icon={option.icon} chevron>
                  <Text className="text-base dark:text-white">
                    {option.title}
                  </Text>
                </SettingsRow>
              </TouchableOpacity>
            </Link>
          );
        })}
      </ScrollView>
    </View>
  );
}
