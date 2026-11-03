import { type ImageProps } from "@expo/ui/swift-ui";

import { type FormIcon } from "./types";

type SFSymbol = NonNullable<ImageProps["systemName"]>;

export const formIcons: Record<FormIcon, SFSymbol> = {
  star: "star",
  person: "person",
  shield: "shield",
  newspaper: "newspaper",
  languages: "character.bubble",
  smartphone: "iphone",
  bell: "bell.badge",
  at: "at",
  mail: "envelope",
  lock: "lock",
  "person-remove": "person.crop.circle.badge.xmark",
  block: "nosign",
  mute: "speaker.slash",
  heart: "heart",
  send: "paperplane",
  wrench: "wrench.and.screwdriver",
  "list-plus": "text.badge.plus",
  search: "magnifyingglass",
};
