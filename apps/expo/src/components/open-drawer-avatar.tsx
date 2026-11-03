import { Platform, TouchableHighlight, TouchableOpacity } from "react-native";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Avatar } from "./avatar";
import { useDrawer } from "./drawer/context";

export const OpenDrawerAvatar = () => {
  const openDrawer = useDrawer();
  const { _ } = useLingui();
  return (
    <TouchableOpacity
      onPress={() => openDrawer()}
      className={Platform.select({
        ios: "ml-1",
        android: "mr-3",
      })}
      accessibilityHint={_(msg`Open drawer menu`)}
    >
      <Avatar self size="small" />
    </TouchableOpacity>
  );
};

export function useOpenDrawerAvatarItem() {
  const openDrawer = useDrawer();
  const { _ } = useLingui();
  return {
    type: "custom",
    hidesSharedBackground: true,
    element: (
      <TouchableHighlight
        onPress={() => openDrawer()}
        accessibilityHint={_(msg`Open drawer menu`)}
        className="rounded-full"
      >
        <Avatar self size="medium" />
      </TouchableHighlight>
    ),
  } as const;
}
