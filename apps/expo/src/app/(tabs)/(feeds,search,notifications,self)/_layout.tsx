import { ActivityIndicator, Platform, View } from "react-native";
import { Stack } from "expo-router";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorBoundary as ErrorBoundaryView } from "~/components/error-boundary";
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
    <AbsolutePathProvider segment={segment}>
      <ErrorBoundary
        FallbackComponent={({ error, resetErrorBoundary }) => (
          <ErrorBoundaryView
            error={error as Error}
            retry={() => Promise.resolve(resetErrorBoundary())}
          />
        )}
      >
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
      </ErrorBoundary>
    </AbsolutePathProvider>
  );
}
