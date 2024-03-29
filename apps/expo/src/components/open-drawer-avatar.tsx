import { TouchableOpacity } from "react-native";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";

import { Avatar } from "./avatar";
import { useDrawer } from "./drawer/context";

export const OpenDrawerAvatar = () => {
  const openDrawer = useDrawer();
  const { _ } = useLingui();
  return (
    <TouchableOpacity
      onPress={() => openDrawer()}
      className="mr-3"
      accessibilityHint={_(msg`Open drawer menu`)}
    >
      <Avatar self size="small" />
    </TouchableOpacity>
  );
};
