import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "@lingui/react/macro";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAgent, useAuth } from "~/lib/agent";
import { useLogOut } from "~/lib/log-out-context";
import { checkSignupQueue } from "~/lib/unspecced";
import { Button } from "../button";
import { Confetti } from "../confetti";
import { Text } from "../themed/text";

export const WaitingRoom = () => {
  const agent = useAgent();
  const { refreshSession } = useAuth();
  const logOut = useLogOut();

  const queue = useQuery({
    queryKey: ["waiting-room"],
    queryFn: async () => {
      if (!agent?.did) return null;
      return await agent.call(checkSignupQueue);
    },
    refetchInterval: 5000,
  });

  const { mutate: logIn } = useMutation({
    mutationFn: async () => {
      await refreshSession();
    },
  });

  if (!queue.data) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-base">
          <Trans>Getting queue position...</Trans>
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 p-4" edges={["left", "top", "right"]}>
      <View className="flex-1 items-center justify-center">
        {queue.data.activated ? (
          <>
            <Text
              className="text-center text-6xl font-medium"
              allowFontScaling={false}
            >
              <Trans>You{"'"}re in!</Trans>
            </Text>
            <Text
              className="mt-4 w-2/3 text-center text-xl"
              maxFontSizeMultiplier={2}
            >
              <Trans>Welcome to Bluesky! We{"'"}re excited to have you.</Trans>
            </Text>
          </>
        ) : (
          <>
            <Text className="text-center text-xl">
              <Trans>You{"'"}re in the queue to join Bluesky!</Trans>
            </Text>
            <Text
              className="mt-8 text-center text-6xl font-medium"
              allowFontScaling={false}
            >
              {queue.data.placeInQueue}
            </Text>
            <Text className="mt-2 text-center text-base">
              <Trans>people ahead of you.</Trans>
            </Text>
            {/* broken dep, fix eventually */}
            {/*{initialQueuePosition !== null && (
              <ProgressBar
                className="mt-8 w-3/4"
                progress={
                  (initialQueuePosition - (placeInQueue ?? 0)) /
                  initialQueuePosition
                }
              />
            )}*/}
          </>
        )}
      </View>
      {queue.data.activated ? (
        <Button variant="black" onPress={() => logIn()}>
          <Trans>Get started</Trans>
        </Button>
      ) : (
        <Button variant="outline" onPress={() => logOut()}>
          <Trans>Log out</Trans>
        </Button>
      )}
      <Confetti run={queue.data.activated} />
    </SafeAreaView>
  );
};
