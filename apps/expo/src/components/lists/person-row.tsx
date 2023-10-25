import { TouchableHighlight, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { TouchableHighlight as BottomSheetTouchableHighlight } from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import { ChevronRightIcon } from "lucide-react-native";

import { Text } from "../text";

interface Props {
  person: AppBskyActorDefs.ProfileView;
  onPress?: () => void;
  bottomSheet?: boolean;
  backgroundColor?: string;
}

export const PersonRow = ({
  person,
  onPress,
  bottomSheet,
  backgroundColor,
}: Props) => {
  const router = useRouter();
  const theme = useTheme();
  const Touchable = bottomSheet
    ? BottomSheetTouchableHighlight
    : TouchableHighlight;
  return (
    <Touchable
      onPress={() => {
        onPress?.();
        router.push(`/profile/${person.handle}`);
      }}
    >
      <View
        style={{ backgroundColor: backgroundColor ?? theme.colors.card }}
        className="flex-row items-center px-4 py-2"
      >
        <View className="mr-3 h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800">
          {person.avatar && (
            <Image
              recyclingKey={person.avatar}
              source={{ uri: person.avatar }}
              className="h-10 w-10 rounded-full"
              alt={person.displayName}
            />
          )}
        </View>
        <View className="flex-1">
          {person.displayName && (
            <Text className="text-base leading-5">{person.displayName}</Text>
          )}
          <Text className="text-sm text-neutral-500 dark:text-neutral-400">
            @{person.handle}
          </Text>
        </View>
        <ChevronRightIcon size={20} className="ml-0.5 text-neutral-500" />
      </View>
    </Touchable>
  );
};
