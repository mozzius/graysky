import { Text } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";
import { View } from "lucide-react-native";

import { ItemSeparator } from "./item-separator";
import { PersonRow } from "./lists/person-row";

interface Props {
  profiles: AppBskyActorDefs.ProfileView[];
}

export const ProfileList = ({ profiles }: Props) => {
  const theme = useTheme();

  return (
    <FlashList<AppBskyActorDefs.ProfileView>
      data={profiles}
      renderItem={({ item }) => <PersonRow person={item} />}
      estimatedItemSize={61}
      ItemSeparatorComponent={() => (
        <ItemSeparator
          iconWidth="w-10"
          containerClassName="pr-4 bg-white dark:bg-black"
        />
      )}
      ListEmptyComponent={() => (
        <View className="py-8">
          <Text
            className="text-center text-base"
            style={{ color: theme.colors.text }}
          >
            You haven't blocked anyone
          </Text>
        </View>
      )}
    />
  );
};
