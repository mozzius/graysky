import { Text, View } from "react-native";
import { AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { FlashList } from "@shopify/flash-list";

import { ItemSeparator } from "./item-separator";
import { PersonRow } from "./lists/person-row";

interface Props {
  profiles: AppBskyActorDefs.ProfileView[];
  emptyText?: string;
}

export const ProfileList = ({
  profiles,
  emptyText = "No profiles found",
}: Props) => {
  const theme = useTheme();

  return (
    <FlashList<AppBskyActorDefs.ProfileView>
      data={profiles}
      renderItem={({ item }) => <PersonRow person={item} />}
      estimatedItemSize={61}
      ItemSeparatorComponent={() => (
        <ItemSeparator
          iconWidth="w-10"
          containerClassName="pr-4"
          backgroundColor={theme.colors.card}
        />
      )}
      ListEmptyComponent={() => (
        <View className="py-12">
          <Text
            className="text-center text-base"
            style={{ color: theme.colors.text }}
          >
            {emptyText}
          </Text>
        </View>
      )}
    />
  );
};
