import { useEffect } from "react";
import { TouchableOpacity, View } from "react-native";
import { ErrorBoundaryProps } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { RefreshCcwIcon } from "lucide-react-native";
import * as Sentry from "sentry-expo";

import { Text } from "./themed/text";

export const ErrorBoundary = ({ error, retry }: ErrorBoundaryProps) => {
  const theme = useTheme();

  useEffect(() => {
    Sentry.Native.captureException(error);
  }, [error]);

  return (
    <View className="flex-1 items-center justify-center">
      <View className="w-3/4 flex-col items-start">
        <Text className="mb-2 text-2xl font-medium">An error occurred</Text>
        {error instanceof Error && (
          <Text className="text-lg">{error.message}</Text>
        )}
        <TouchableOpacity
          className="mt-8 flex-row items-center rounded-full py-2 pl-4 pr-8"
          style={{ backgroundColor: theme.colors.primary }}
          onPress={() => retry()}
        >
          <RefreshCcwIcon size={20} className="text-white" />
          <Text className="ml-4 text-xl text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
