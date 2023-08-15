import { Linking, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import { Image, type ImageSource } from "expo-image";
import { Link } from "expo-router";
import {
  AtSignIcon,
  GithubIcon,
  HeartIcon,
  MailIcon,
  SendIcon,
  WrenchIcon,
} from "lucide-react-native";

import { GroupedList } from "../../components/grouped-list";
import { Text } from "../../components/text";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appIcon = require("../../../assets/graysky.png") as ImageSource;

const groups = [
  {
    options: [
      {
        title: "Star us on GitHub!",
        onPress: () => Linking.openURL("https://github.com/mozzius/graysky"),
        icon: GithubIcon,
        chevron: true,
      },
      {
        title: "Sign up for project updates",
        onPress: () => Linking.openURL("https://graysky.app"),
        icon: MailIcon,
        chevron: true,
      },
      {
        title: "Contact",
        onPress: () => Linking.openURL("mailto:hello@graysky.app"),
        icon: SendIcon,
        chevron: true,
      },
    ],
  },
  {
    title: "Created by",
    options: [
      {
        title: "mozzius.dev",
        href: "/profile/mozzius.dev",
        icon: AtSignIcon,
      },
      {
        title: "Sponsor my work",
        onPress: () => Linking.openURL("https://github.com/sponsors/mozzius"),
        icon: HeartIcon,
        chevron: true,
      },
    ],
  },
  {
    title: "Contributors",
    options: [
      {
        title: "alice.bsky.sh",
        href: "/profile/alice.bsky.sh",
        icon: AtSignIcon,
      },
      {
        title: "holden.bsky.social",
        href: "/profile/holden.bsky.social",
        icon: AtSignIcon,
      },
      {
        title: "matthewstanciu.com",
        href: "/profile/matthewstanciu.com",
        icon: AtSignIcon,
      },
      {
        title: "jcsalterego.bsky.social",
        href: "/profile/jcsalterego.bsky.social",
        icon: AtSignIcon,
      },
    ],
  },
  {
    title: "App info",
    options: [
      {
        title: `Version ${Constants.expoConfig?.version ?? "unknown"}`,
        icon: WrenchIcon,
      },
    ],
  },
];

export default function AboutPage() {
  return (
    <GroupedList groups={groups}>
      <View className="mb-4 flex-row items-center justify-center py-4">
        <Image
          alt="graysky"
          source={appIcon}
          className="h-20 w-20 rounded-xl"
        />
        <View className="ml-6">
          <Text className="text-lg font-medium">Graysky</Text>
          <Link href="/profile/did:plc:p2cp5gopk7mgjegy6wadk3ep" asChild>
            <TouchableOpacity>
              <Text className="text-base text-neutral-600 dark:text-neutral-400">
                by @mozzius.dev
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </GroupedList>
  );
}
