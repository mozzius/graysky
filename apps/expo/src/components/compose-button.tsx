import { Pressable } from "react-native";
import { Edit3 } from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useComposer } from "./composer";

export const ComposeButton = () => {
  const { open } = useComposer();
  const { colorScheme } = useColorScheme();
  return (
    <Pressable
      accessibilityLabel="Compose post"
      accessibilityRole="button"
      onPress={() => open()}
      className="absolute bottom-6 right-4 h-14 w-14 items-center justify-center rounded-full bg-neutral-800 dark:bg-white"
    >
      <Edit3 size={24} color={colorScheme === "light" ? "white" : "black"} />
    </Pressable>
  );
};
