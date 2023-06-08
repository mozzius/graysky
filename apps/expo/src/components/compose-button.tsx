import { Alert, Pressable } from "react-native";
import { HoldItem } from "react-native-hold-menu";
import { useTheme } from "@react-navigation/native";
import {
  Edit3,
  MessageSquareDashed,
  MessageSquarePlus,
} from "lucide-react-native";
import { styled } from "nativewind";

import { useComposer } from "./composer";

const StyledHoldItem = styled(HoldItem, {
  props: {
    containerStyles: true,
  },
});

export const ComposeButton = () => {
  const { open } = useComposer();
  const theme = useTheme();

  return (
    <StyledHoldItem
      containerStyles="absolute bottom-6 right-4"
      bottom
      items={[
        {
          text: "New post",
          onPress: () => open(),
          icon: () => <MessageSquarePlus size={18} color={theme.colors.text} />,
        },
        {
          text: "View drafts",
          onPress: () => Alert.alert("🚧 Coming soon 🚧"),
          icon: () => (
            <MessageSquareDashed size={18} color={theme.colors.text} />
          ),
        },
      ]}
    >
      <Pressable
        accessibilityLabel="Compose post"
        accessibilityRole="button"
        onPress={() => open()}
        className="h-14 w-14 items-center justify-center rounded-full bg-neutral-800 dark:bg-white"
      >
        <Edit3 size={24} className="text-white dark:text-black" />
      </Pressable>
    </StyledHoldItem>
  );
};
