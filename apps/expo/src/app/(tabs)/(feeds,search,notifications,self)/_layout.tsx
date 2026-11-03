import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
import { Trans } from "@lingui/react/macro";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorBoundary as ErrorBoundaryView } from "~/components/error-boundary";
import { Text } from "~/components/themed/text";
import { AbsolutePathProvider } from "~/lib/absolute-path-context";
import { useSession } from "~/lib/agent";
import { isIOS26 } from "~/lib/utils/version";

// each tab shares this layout, so the initial route is set per group
export const unstable_settings = {
  feeds: { anchor: "feeds/index" },
  search: { anchor: "search/index" },
  notifications: { anchor: "notifications" },
  self: { anchor: "self" },
};

export default function SubStack({
  segment,
}: {
  segment: "(feeds)" | "(search)" | "(notifications)" | "(self)";
}) {
  const session = useSession();

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-base">
          <Trans>Connecting...</Trans>
        </Text>
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
            headerBackButtonDisplayMode: isIOS26 ? "minimal" : "default",
          }}
        />
      </ErrorBoundary>
    </AbsolutePathProvider>
  );
}
