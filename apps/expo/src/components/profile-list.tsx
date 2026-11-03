import { View } from "react-native";
import { useTheme } from "expo-router/react-navigation";
import { type app } from "@bsky/sdk/lexicons";
import { FlashList } from "@shopify/flash-list";

import { ItemSeparator } from "./item-separator";
import { PersonRow } from "./lists/person-row";
import { Text } from "./themed/text";

type Profile =
  app.bsky.actor.defs.ProfileView | app.bsky.actor.defs.ProfileViewDetailed;

interface Props {
  profiles: Profile[];
  emptyText?: string;
  onProfilePress?: (evt: {
    preventDefault: () => void;
    person: Profile;
  }) => void;
}

export const ProfileList = ({
  profiles,
  emptyText = "No profiles found",
  onProfilePress,
}: Props) => {
  const theme = useTheme();

  return (
    <FlashList<Profile>
      removeClippedSubviews
      data={profiles}
      renderItem={({ item }) => (
        <PersonRow
          person={item}
          onPress={(evt) => onProfilePress?.({ ...evt, person: item })}
        />
      )}
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
