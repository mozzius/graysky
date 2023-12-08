import { ActivityIndicator, View } from "react-native";
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";

import { Text } from "./themed/text";

interface Props<TData = unknown, TError = unknown> {
  text?: string;
  query: UseInfiniteQueryResult<InfiniteData<TData, TError>, unknown>;
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
