import { TouchableOpacity } from "react-native";

import { Avatar } from "./avatar";
import { useDrawer } from "./drawer/context";

export const OpenDrawerAvatar = () => {
  const openDrawer = useDrawer();
  return (
    <TouchableOpacity
      onPress={() => openDrawer()}
      className="mr-3"
      accessibilityHint="Open drawer menu"
    >
      <Avatar size="small" />
    </TouchableOpacity>
  );
};
