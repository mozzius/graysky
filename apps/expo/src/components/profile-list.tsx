import { View } from "react-native";
import { type AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";

import { ItemSeparator } from "./item-separator";
import { PersonRow } from "./lists/person-row";
import { Text } from "./text";

interface Props {
  profiles: AppBskyActorDefs.ProfileView[];
  emptyText?: string;
  onProfilePress?: (evt: {
    preventDefault: () => void;
    person: AppBskyActorDefs.ProfileView;
  }) => void;
}

export const ProfileList = ({
  profiles,
  emptyText = "No profiles found",
  onProfilePress,
}: Props) => {
  const theme = useTheme();

  return (
    <FlashList<AppBskyActorDefs.ProfileView>
      data={profiles}
      renderItem={({ item }) => (
        <PersonRow
          person={item}
          onPress={(evt) => onProfilePress?.({ ...evt, person: item })}
        />
      )}
      estimatedItemSize={61}
      ItemSeparatorComponent={() => (
        <ItemSeparator
          iconWidth="w-10"
          containerClassName="pr-4"
          backgroundColor={theme.colors.card}
        />
      )}
      ListFooterComponent={<View className="h-20" />}
      ListEmptyComponent={() => (
        <View className="py-12">
          <Text className="text-center text-base">{emptyText}</Text>
        </View>
      )}
    />
  );
};
