import { Alert } from "react-native";
import { type BskyAgent } from "@atproto/api";

import { queryClient } from "./query-client";

export const muteAccount = (agent: BskyAgent, handle: string, did: string) => {
  Alert.alert("Mute", `Are you sure you want to mute @${handle}?`, [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: "Mute",
      style: "destructive",
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onPress: async () => {
        await agent.mute(did);
        await queryClient.invalidateQueries(["profile"]);
        Alert.alert("Muted", `You will no longer see posts from @${handle}.`);
      },
    },
  ]);
};

export const blockAccount = (agent: BskyAgent, handle: string, did: string) => {
  Alert.alert("Block", `Are you sure you want to block @${handle}?`, [
    {
      text: "Cancel",
      style: "cancel",
    },
    {
      text: "Block",
      style: "destructive",
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      onPress: async () => {
        await agent.app.bsky.graph.block.create(
          { repo: agent.session!.did },
          {
            createdAt: new Date().toISOString(),
            subject: did,
          },
        );
        await queryClient.invalidateQueries(["profile"]);
        Alert.alert("Blocked", `@${handle} has been blocked.`);
      },
    },
  ]);
};
