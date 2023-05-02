import { Pressable } from "react-native";
import { Edit3 } from "lucide-react-native";

import { useComposer } from "./composer";

export const ComposeButton = () => {
  const { open } = useComposer();
  return (
    <Pressable
      accessibilityLabel="Compose post"
      accessibilityRole="button"
      onPress={() => open()}
      className="absolute bottom-6 right-4 h-14 w-14 items-center justify-center rounded-full bg-neutral-800"
    >
      <Edit3 size={24} color="white" />
    </Pressable>
  );
};
