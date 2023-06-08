import { Linking, Text, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import { Image, type ImageSource } from "expo-image";
import { Link } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { AtSign, Github, Heart, Mail, Send, Wrench } from "lucide-react-native";

import { SettingsListGroups } from "./_layout";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appIcon = require("../../../assets/graysky.png") as ImageSource;

const groups = [
  {
    options: [
      {
        title: "Star us on GitHub!",
        onPress: () => Linking.openURL("https://github.com/mozzius/graysky"),
        icon: Github,
      },
      {
        title: "Sign up for project updates",
        onPress: () => Linking.openURL("https://graysky.app"),
        icon: Mail,
      },
      {
        title: "Contact",
        onPress: () => Linking.openURL("mailto:hello@graysky.app"),
        icon: Send,
      },
    ],
  },
  {
    title: "Created by",
    options: [
      {
        title: "mozzius.dev",
        href: "/profile/mozzius.dev",
        icon: AtSign,
      },
      {
        title: "Sponsor my work",
        onPress: () => Linking.openURL("https://github.com/sponsors/mozzius"),
        icon: Heart,
      },
    ],
  },
  {
    title: "Contributors",
    options: [
      {
        title: "alice.bsky.sh",
        href: "/profile/alice.bsky.sh",
        icon: AtSign,
      },
      {
        title: "holden.bsky.social",
        href: "/profile/holden.bsky.social",
        icon: AtSign,
      },
      {
        title: "matthewstanciu.com",
        href: "/profile/matthewstanciu.com",
        icon: AtSign,
      },
    ],
  },
  {
    title: "App info",
    options: [
      {
        title: `Version ${Constants.expoConfig?.version ?? "unknown"}`,
        icon: Wrench,
      },
    ],
  },
];

export default function AboutPage() {
  const theme = useTheme();

  return (
    <SettingsListGroups groups={groups}>
      <View className="mb-4 flex-row items-center justify-center">
        <Image
          alt="graysky"
          source={appIcon}
          className="h-20 w-20 rounded-xl"
        />
        <View className="ml-6">
          <Text
            style={{ color: theme.colors.text }}
            className="text-lg font-medium"
          >
            Graysky
          </Text>
          <Link href="/profile/mozzius.dev" asChild>
            <TouchableOpacity>
              <Text className="text-base text-neutral-600 dark:text-neutral-400">
                by @mozzius.dev
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </SettingsListGroups>
  );
}
