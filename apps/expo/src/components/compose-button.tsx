import { Pressable } from "react-native";
import { useTheme } from "@react-navigation/native";
import { Edit3 } from "lucide-react-native";

import { cx } from "../lib/utils/cx";
import { useComposer } from "./composer";

export const ComposeButton = () => {
  const { open } = useComposer();
  const theme = useTheme();
  return (
    <Pressable
      accessibilityLabel="Compose post"
      accessibilityRole="button"
      onPress={() => open()}
      className={cx(
        "absolute bottom-6 right-4 h-14 w-14 items-center justify-center rounded-full",
        theme.dark ? "bg-white" : "bg-neutral-800",
      )}
    >
      <Edit3 size={24} color={theme.dark ? "black" : "white"} />
    </Pressable>
  );
};
