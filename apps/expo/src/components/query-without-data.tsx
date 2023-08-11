import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import {
  type InfiniteQueryObserverLoadingErrorResult,
  type InfiniteQueryObserverLoadingResult,
  type QueryObserverLoadingErrorResult,
  type QueryObserverLoadingResult,
} from "@tanstack/react-query";
import { RefreshCcwIcon } from "lucide-react-native";

import { Button } from "./button";

interface Props {
  query:
    | QueryObserverLoadingResult
    | QueryObserverLoadingErrorResult
    | InfiniteQueryObserverLoadingResult
    | InfiniteQueryObserverLoadingErrorResult;
}

export const QueryWithoutData = ({ query }: Props) => {
  const theme = useTheme();
  if (query.error) {
    return (
      <View className="flex-1 items-center justify-center">
        <View className="w-3/4 flex-col items-start">
          <Text
            className="mb-2 text-2xl font-medium"
            style={{ color: theme.colors.text }}
          >
            An error occurred
          </Text>
          {query.error instanceof Error && (
            <Text className="text-center text-lg">{query.error.message}</Text>
          )}
          <TouchableOpacity
            className="mt-8 flex-row items-center rounded-full py-2 pl-4 pr-8"
            style={{
              backgroundColor: theme.colors.primary,
            }}
          >
            <RefreshCcwIcon size={20} className="text-white" />
            <Text className="ml-4 text-xl text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" />
    </View>
  );
};
