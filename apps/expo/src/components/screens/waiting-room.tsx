import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ProgressView } from "@react-native-community/progress-view";
import { useMutation, useQuery } from "@tanstack/react-query";
import { styled } from "nativewind";

import { useAgent } from "~/lib/agent";
import { useLogOut } from "~/lib/log-out-context";
import { Button } from "../button";
import { Confetti } from "../confetti";
import { Text } from "../themed/text";

const ProgressBar = styled(ProgressView);

export const WaitingRoom = () => {
  const agent = useAgent();
  const [initialQueuePosition, setInitialQueuePosition] = useState<
    number | null
  >(null);
  const logOut = useLogOut();

  const queue = useQuery({
    queryKey: ["waiting-room"],
    queryFn: async () => {
      if (!agent?.hasSession) return null;
      const queue = await agent.com.atproto.temp.checkSignupQueue();
      if (!queue.success) throw new Error("Failed to fetch queue");
      return queue.data;
    },
    refetchInterval: 5000,
  });

  const placeInQueue = queue.data?.placeInQueue;

  useEffect(() => {
    if (typeof placeInQueue !== "number") return;
    setInitialQueuePosition((pos) => pos ?? placeInQueue);
  }, [placeInQueue]);

  const { mutate: logIn } = useMutation({
    mutationFn: async () => {
      await agent.refreshSession();
    },
  });

  if (!queue.data) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-black">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-center text-base">
          Getting queue position...
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
              You{"'"}re in!
            </Text>
            <Text
              className="mt-4 w-2/3 text-center text-xl"
              maxFontSizeMultiplier={2}
            >
              Welcome to Bluesky! We{"'"}re excited to have you.
            </Text>
          </>
        ) : (
          <>
            <Text className="text-center text-xl">
              You{"'"}re in the queue to join Bluesky!
            </Text>
            <Text
              className="mt-8 text-center text-6xl font-medium"
              allowFontScaling={false}
            >
              {queue.data.placeInQueue}
            </Text>
            <Text className="mt-2 text-center text-base">
              people ahead of you.
            </Text>
            {initialQueuePosition !== null && (
              <ProgressBar
                className="mt-8 w-3/4"
                progress={
                  (initialQueuePosition - (placeInQueue ?? 0)) /
                  initialQueuePosition
                }
              />
            )}
          </>
        )}
      </View>
      {queue.data.activated ? (
        <Button variant="black" onPress={() => logIn()}>
          Get started
        </Button>
      ) : (
        <Button variant="outline" onPress={() => logOut()}>
          Log out
        </Button>
      )}
      <Confetti run={queue.data.activated} />
    </SafeAreaView>
  );
};
