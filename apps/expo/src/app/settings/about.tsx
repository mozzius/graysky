import { Linking, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import { Image, type ImageSource } from "expo-image";
import { Link } from "expo-router";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import {
  AtSignIcon,
  GithubIcon,
  HeartIcon,
  MailIcon,
  SendIcon,
  WrenchIcon,
} from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useLinkPress } from "~/lib/hooks/link-press";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const appIcon = require("../../../assets/icon.png") as ImageSource;

export default function AboutPage() {
  const { openLink } = useLinkPress();
  const { _ } = useLingui();

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          {
            options: [
              {
                title: _(msg`Star us on GitHub!`),
                accessibilityRole: "link",
                onPress: () => openLink("https://github.com/mozzius/graysky"),
                icon: GithubIcon,
                chevron: true,
              },
              {
                title: _(msg`Sign up for project updates`),
                accessibilityRole: "link",
                onPress: () => openLink("https://graysky.app"),
                icon: MailIcon,
                chevron: true,
              },
              {
                title: _(msg`Contact`),
                accessibilityRole: "link",
                onPress: () => Linking.openURL("mailto:hello@graysky.app"),
                icon: SendIcon,
                chevron: true,
              },
            ],
          },
          {
            title: _(msg`Created by`),
            options: [
              {
                title: "mozzius.dev",
                accessibilityRole: "link",
                href: "/profile/did:plc:p2cp5gopk7mgjegy6wadk3ep",
                icon: AtSignIcon,
              },
              {
                title: _(msg`Sponsor my work`),
                accessibilityRole: "link",
                onPress: () => openLink("https://github.com/sponsors/mozzius"),
                icon: HeartIcon,
                chevron: true,
              },
            ],
          },
          {
            title: _(msg`Contributors`),
            options: [
              {
                title: "alice.bsky.sh",
                accessibilityRole: "link",
                href: "/profile/did:plc:by3jhwdqgbtrcc7q4tkkv3cf",
                icon: AtSignIcon,
              },
              {
                title: "holden.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:tzq3i67wnarn6x2kbjcprnfx",
                icon: AtSignIcon,
              },
              {
                title: "matthewstanciu.com",
                accessibilityRole: "link",
                href: "/profile/did:plc:ming7lqd64h7zh4da2c6sgxx",
                icon: AtSignIcon,
              },
              {
                title: "jcsalterego.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:vc7f4oafdgxsihk4cry2xpze",
                icon: AtSignIcon,
              },
              {
                title: "st-cyr.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:5rcf7fsqqx3ckxps3ir6etsg",
                icon: AtSignIcon,
              },
              {
                title: "haileyok.com",
                accessibilityRole: "link",
                href: "/profile/did:plc:oisofpd7lj26yvgiivf3lxsi",
                icon: AtSignIcon,
              },
              {
                title: "surfdude29.ispost.ing",
                accessibilityRole: "link",
                href: "/profile/did:plc:sflxm2fxohaqpfgahgdlm7rl",
                icon: AtSignIcon,
              },
              {
                title: "reindex.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:aeh2msk2nvakndnhovbdmzqq",
                icon: AtSignIcon,
              },
              {
                title: "@narooo.com",
                accessibilityRole: "link",
                href: "/profile/did:plc:2wlwhbmg2yga6vvei4zpwcjt",
                icon: AtSignIcon,
              },
            ],
            footer: _(
              msg`If you have contributed to Graysky, for example helping with translations, please reach out to @graysky.app so we can add you to this list!`,
            ),
          },
          {
            title: _(msg`Logo designed by`),
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
            title: _(msg`App info`),
            options: [
              {
                title: Constants.expoConfig?.version
                  ? _(msg`Version ${Constants.expoConfig.version}`)
                  : _(msg`Version unknown`),
                icon: WrenchIcon,
              },
            ],
          },
        ]}
      >
        <View className="flex-row items-center justify-center pb-8">
          <View
            className="h-20 w-20 overflow-hidden rounded-2xl"
            style={{ borderCurve: "continuous" }}
          >
            <Image alt="graysky" source={appIcon} className="flex-1" />
          </View>
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
    </TransparentHeaderUntilScrolled>
  );
}
