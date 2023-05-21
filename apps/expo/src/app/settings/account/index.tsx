import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useQuery } from "@tanstack/react-query";
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
      <View className="mx-4 my-4 rounded-sm flex-row items-center bg-white p-4 py-4 text-center text-2xl font-bold dark:bg-black">
        <Avatar size="large" />
        <View className="ml-4">
          <Text className="text-base font-bold dark:text-neutral-50">
            @{agent?.session?.handle}
          </Text>
          <Text className="text-base dark:text-neutral-50">
            {agent?.session?.email}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1">
        {options.map((option) => {
          return (
            <Link asChild href={option.href} key={option.title}>
              <TouchableOpacity>
                <SettingsRow icon={option.icon} chevron>
                  <Text className="text-base dark:text-neutral-50">
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
