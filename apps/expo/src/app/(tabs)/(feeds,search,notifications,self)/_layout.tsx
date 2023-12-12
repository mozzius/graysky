import { useEffect } from "react";
import {
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { RefreshCcwIcon } from "lucide-react-native";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import * as Sentry from "sentry-expo";

import { Text } from "~/components/themed/text";
import { AbsolutePathProvider } from "~/lib/absolute-path-context";
import { useOptionalAgent } from "~/lib/agent";

export default function SubStack({
  segment,
}: {
  segment: "(feeds)" | "(search)" | "(notifications)" | "(self)";
}) {
  // agent might not be available yet
  const agent = useOptionalAgent();

  if (!agent?.hasSession) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-base">Connecting...</Text>
      </View>
    );
  }

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <AbsolutePathProvider segment={segment}>
        <Stack
          screenOptions={{
            fullScreenGestureEnabled: true,
            ...Platform.select({
              android: {
                animation: "ios",
              },
            }),
          }}
        />
      </AbsolutePathProvider>
    </ErrorBoundary>
  );
}

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
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
          onPress={() => resetErrorBoundary()}
        >
          <RefreshCcwIcon size={20} className="text-white" />
          <Text className="ml-4 text-xl text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
