import { useEffect, useRef } from "react";
import { ActivityIndicator, TouchableOpacity, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { useTheme } from "@react-navigation/native";
import { RefreshCcwIcon } from "lucide-react-native";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import { Text } from "~/components/text";
import { useOptionalAgent } from "~/lib/agent";
import { useQuickAction } from "~/lib/quick-actions";

const stackOptions = {
  screenOptions: {
    fullScreenGestureEnabled: true,
  },
};

export default function SubStack() {
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
      <QuickActions />
      <Stack {...stackOptions} />
    </ErrorBoundary>
  );
}

const QuickActions = () => {
  const fired = useRef<string | null>(null);
  const router = useRouter();
  const action = useQuickAction();

  const href = action?.params?.href;

  useEffect(() => {
    if (typeof href !== "string" || fired.current === href) return;
    fired.current = href;
    router.push(href);
  }, [href, router]);

  return null;
};

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const theme = useTheme();
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
