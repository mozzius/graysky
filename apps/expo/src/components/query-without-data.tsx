import { Button } from "./button";
import {
  type InfiniteQueryObserverLoadingErrorResult,
  type InfiniteQueryObserverLoadingResult,
  type QueryObserverLoadingErrorResult,
  type QueryObserverLoadingResult,
} from "@tanstack/react-query";
import { ActivityIndicator, Text, View } from "react-native";

interface Props {
  query:
    | QueryObserverLoadingResult
    | QueryObserverLoadingErrorResult
    | InfiniteQueryObserverLoadingResult
    | InfiniteQueryObserverLoadingErrorResult;
}

export const QueryWithoutData = ({ query }: Props) => {
  if (query.error) {
    return (
      <View className="flex-1 items-center justify-center p-4">
        <Text className="mb-4 text-center text-lg">
          {query.error instanceof Error
            ? query.error.message
            : "An error occurred"}
        </Text>
        <Button
          variant="outline"
          onPress={() => void query.refetch()}
          className="mt-4"
        >
          Retry
        </Button>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator />
    </View>
  );
};
