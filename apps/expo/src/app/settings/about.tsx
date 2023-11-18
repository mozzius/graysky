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

import { GroupedList } from "~/components/grouped-list";
import { Text } from "~/components/text";
import { useLinkPress } from "~/lib/hooks/link-press";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appIcon = require("../../../assets/graysky.png") as ImageSource;

export default function AboutPage() {
  const { openLink } = useLinkPress();
  return (
    <GroupedList
      groups={[
        {
          options: [
            {
              title: "Star us on GitHub!",
              accessibilityRole: "link",
              onPress: () => openLink("https://github.com/mozzius/graysky"),
              icon: GithubIcon,
              chevron: true,
            },
            {
              title: "Sign up for project updates",
              accessibilityRole: "link",
              onPress: () => openLink("https://graysky.app"),
              icon: MailIcon,
              chevron: true,
            },
            {
              title: "Contact",
              accessibilityRole: "link",
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
              accessibilityRole: "link",
              href: "/profile/mozzius.dev",
              icon: AtSignIcon,
            },
            {
              title: "Sponsor my work",
              accessibilityRole: "link",
              onPress: () => openLink("https://github.com/sponsors/mozzius"),
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
              accessibilityRole: "link",
              href: "/profile/alice.bsky.sh",
              icon: AtSignIcon,
            },
            {
              title: "holden.bsky.social",
              accessibilityRole: "link",
              href: "/profile/holden.bsky.social",
              icon: AtSignIcon,
            },
            {
              title: "matthewstanciu.com",
              accessibilityRole: "link",
              href: "/profile/matthewstanciu.com",
              icon: AtSignIcon,
            },
            {
              title: "jcsalterego.bsky.social",
              accessibilityRole: "link",
              href: "/profile/jcsalterego.bsky.social",
              icon: AtSignIcon,
            },
            {
              title: "st-cyr.bsky.social",
              accessibilityRole: "link",
              href: "/profile/st-cyr.bsky.social",
              icon: AtSignIcon,
            },
          ],
        },
        {
          title: "Logo designed by",
          options: [
            {
              title: "roselia.gay",
              accessibilityRole: "link",
              href: "/profile/roselia.gay",
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
      ]}
    >
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
