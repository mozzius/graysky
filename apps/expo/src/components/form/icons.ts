/* eslint-disable @typescript-eslint/no-require-imports */
import { type FormIcon } from "./types";

// material symbols (outlined, 24px), from google/material-design-icons
export const formIcons: Record<FormIcon, number> = {
  star: require("../../../assets/icons/star.xml") as number,
  person: require("../../../assets/icons/person.xml") as number,
  shield: require("../../../assets/icons/shield.xml") as number,
  newspaper: require("../../../assets/icons/newspaper.xml") as number,
  languages: require("../../../assets/icons/translate.xml") as number,
  smartphone: require("../../../assets/icons/smartphone.xml") as number,
  bell: require("../../../assets/icons/bell.xml") as number,
  at: require("../../../assets/icons/at.xml") as number,
  mail: require("../../../assets/icons/mail.xml") as number,
  lock: require("../../../assets/icons/lock.xml") as number,
  "person-remove": require("../../../assets/icons/person-remove.xml") as number,
  block: require("../../../assets/icons/block.xml") as number,
  mute: require("../../../assets/icons/volume-off.xml") as number,
  heart: require("../../../assets/icons/heart.xml") as number,
  send: require("../../../assets/icons/send.xml") as number,
  wrench: require("../../../assets/icons/build.xml") as number,
  "list-plus": require("../../../assets/icons/playlist-add.xml") as number,
  search: require("../../../assets/icons/search.xml") as number,
};

export const checkIcon = require("../../../assets/icons/check.xml") as number;
export const addIcon = require("../../../assets/icons/add.xml") as number;
export const copyIcon = require("../../../assets/icons/copy.xml") as number;
