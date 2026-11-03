import { Linking, TouchableOpacity, View } from "react-native";
import Constants from "expo-constants";
import { Image, type ImageSource } from "expo-image";
import { Link } from "expo-router";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Form } from "~/components/form";
import { Text } from "~/components/themed/text";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useLinkPress } from "~/lib/hooks/link-press";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const appIcon = require("../../../assets/icon.png") as ImageSource;

export default function AboutPage() {
  const { openLink } = useLinkPress();
  const { _ } = useLingui();

  return (
    <TransparentHeaderUntilScrolled>
      <Form
        header={
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
        }
        sections={[
          {
            rows: [
              {
                title: _(msg`Star us on GitHub!`),
                accessibilityRole: "link",
                onPress: () => openLink("https://github.com/mozzius/graysky"),
                icon: "star",
                chevron: true,
              },
              {
                title: _(msg`Sign up for project updates`),
                accessibilityRole: "link",
                onPress: () => openLink("https://graysky.app"),
                icon: "mail",
                chevron: true,
              },
              {
                title: _(msg`Contact`),
                accessibilityRole: "link",
                onPress: () => Linking.openURL("mailto:hello@graysky.app"),
                icon: "send",
                chevron: true,
              },
            ],
          },
          {
            title: _(msg`Created by`),
            rows: [
              {
                title: "mozzius.dev",
                accessibilityRole: "link",
                href: "/profile/did:plc:p2cp5gopk7mgjegy6wadk3ep",
                icon: "at",
              },
              {
                title: _(msg`Sponsor my work`),
                accessibilityRole: "link",
                onPress: () => openLink("https://github.com/sponsors/mozzius"),
                icon: "heart",
                chevron: true,
              },
            ],
          },
          {
            title: _(msg`Contributors`),
            rows: [
              {
                title: "alice.bsky.sh",
                accessibilityRole: "link",
                href: "/profile/did:plc:by3jhwdqgbtrcc7q4tkkv3cf",
                icon: "at",
              },
              {
                title: "holden.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:tzq3i67wnarn6x2kbjcprnfx",
                icon: "at",
              },
              {
                title: "matthewstanciu.com",
                accessibilityRole: "link",
                href: "/profile/did:plc:ming7lqd64h7zh4da2c6sgxx",
                icon: "at",
              },
              {
                title: "jcsalterego.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:vc7f4oafdgxsihk4cry2xpze",
                icon: "at",
              },
              {
                title: "st-cyr.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:5rcf7fsqqx3ckxps3ir6etsg",
                icon: "at",
              },
              {
                title: "haileyok.com",
                accessibilityRole: "link",
                href: "/profile/did:plc:oisofpd7lj26yvgiivf3lxsi",
                icon: "at",
              },
              {
                title: "surfdude29.ispost.ing",
                accessibilityRole: "link",
                href: "/profile/did:plc:sflxm2fxohaqpfgahgdlm7rl",
                icon: "at",
              },
              {
                // ja translator
                title: "reindex.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:aeh2msk2nvakndnhovbdmzqq",
                icon: "at",
              },
              {
                // ja translator
                title: "narooo.com",
                accessibilityRole: "link",
                href: "/profile/did:plc:2wlwhbmg2yga6vvei4zpwcjt",
                icon: "at",
              },
              {
                // fr translator
                title: "yanyannoche.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:5on2afqpkkltppdaongk2ywo",
                icon: "at",
              },
              {
                // be translator
                title: "bielarusajed.gay",
                accessibilityRole: "link",
                href: "/profile/did:plc:cc6igt4stjocuhiz4mlarhu4",
                icon: "at",
              },
              {
                // de translator
                title: "turbotommi.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:poeyfpephkz63koenojgtzsm",
                icon: "at",
              },
              {
                // cs translator
                title: "poniczech.gay",
                accessibilityRole: "link",
                href: "/profile/did:plc:4mxujtveqpcqv4mlwwhcqqpt",
                icon: "at",
              },
              {
                // ml translator
                title: "abhijithgopan.com",
                accessibilityRole: "link",
                href: "/profile/did:plc:wmy6jwdxbkizrbhegvegy3xs",
                icon: "at",
              },
              {
                // pt-BR translator
                title: "deck.blue",
                accessibilityRole: "link",
                href: "/profile/did:plc:w342borqxtyo2pul67ec2pwt",
                icon: "at",
              },
              {
                // uk translator
                title: "cpthorn1100.bsky.social",
                accessibilityRole: "link",
                href: "/profile/did:plc:3loo4eggng7s7njjox2qbdcv",
                icon: "at",
              },
              {
                // hr translator
                title: "mattmarenic.com",
                accessibilityRole: "link",
                href: "/profile/did:plc:5fd357reo5rjbjbf6n3iji2s",
                icon: "at",
              },
            ],
            footer: _(
              msg`If you have contributed to Graysky, for example helping with translations, please reach out to @graysky.app so we can add you to this list!`,
            ),
          },
          {
            title: _(msg`Logo designed by`),
            rows: [
              {
                title: "roselia.gay",
                accessibilityRole: "link",
                href: "/profile/roselia.gay",
                icon: "at",
              },
            ],
          },
          {
            title: _(msg`App info`),
            rows: [
              {
                title: Constants.expoConfig?.version
                  ? _(msg`Version ${Constants.expoConfig.version}`)
                  : _(msg`Version unknown`),
                icon: "wrench",
              },
            ],
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}
