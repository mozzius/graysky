import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trans } from "@lingui/macro";
import { useMutation, useQuery } from "@tanstack/react-query";

import { useAgent } from "~/lib/agent";
import { useLogOut } from "~/lib/log-out-context";
import { Button } from "../button";
import { Confetti } from "../confetti";
import { Text } from "../themed/text";

export const WaitingRoom = () => {
  const agent = useAgent();
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
