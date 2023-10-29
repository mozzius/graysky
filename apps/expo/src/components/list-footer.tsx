import { ActivityIndicator, View } from "react-native";
import { type UseInfiniteQueryResult } from "@tanstack/react-query";

import { Text } from "./text";

interface Props {
  text?: string;
  query: UseInfiniteQueryResult;
}

export const ListFooterComponent = ({ text, query }: Props) =>
  query.isFetching ? (
    <View className="w-full items-center justify-center py-8">
      <ActivityIndicator />
      {text && (
        <Text className="mt-4 text-center text-sm text-neutral-400">
          {text}
        </Text>
      )}
    </View>
  ) : !query.hasNextPage ? (
    <View className="py-16">
      <Text className="text-center">That&apos;s everything!</Text>
    </View>
  ) : null;
