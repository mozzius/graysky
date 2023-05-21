import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { Link } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Ban, Smartphone, User } from "lucide-react-native";

import { SettingsRow } from "../../components/settings-row";

const options = [
  {
    title: "Account",
    href: "/settings/account",
    icon: User,
  },
  {
    title: "Content Moderation",
    href: "/settings/content-moderation",
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
    <View className="flex-1 dark:border-t dark:border-neutral-700">
      <StatusBar style="light" />
      <Text className="p-4 py-4 text-center text-2xl font-bold">
        WIP - not all of these work
      </Text>
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
