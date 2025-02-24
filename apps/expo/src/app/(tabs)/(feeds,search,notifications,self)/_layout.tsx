import { useMemo } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Stack } from "expo-router";
import { Trans } from "@lingui/macro";
import { jwtDecode } from "jwt-decode";
import { ErrorBoundary } from "react-error-boundary";

import { ErrorBoundary as ErrorBoundaryView } from "~/components/error-boundary";
import { WaitingRoom } from "~/components/screens/waiting-room";
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

  const decodedJwt = useMemo(() => {
    if (!agent?.session?.accessJwt) return null;
    return jwtDecode<{ scope: string }>(agent.session.accessJwt);
  }, [agent?.session?.accessJwt]);

  if (!decodedJwt) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-base">
          <Trans>Connecting...</Trans>
        </Text>
      </View>
    );
  }

  switch (decodedJwt.scope) {
    case "com.atproto.deactivated":
      // in the queue
      return <WaitingRoom />;
    default:
      // should probably work fine
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
              initialRouteName={getInitialRouteName(segment)}
              screenOptions={{}}
            />
          </ErrorBoundary>
        </AbsolutePathProvider>
      );
  }
}

const getInitialRouteName = (
  segment: "(feeds)" | "(search)" | "(notifications)" | "(self)",
) => {
  switch (segment) {
    case "(feeds)":
      return "feeds/index";
    case "(search)":
      return "search/index";
    case "(notifications)":
      return "notifications";
    case "(self)":
      return "self";
  }
};
