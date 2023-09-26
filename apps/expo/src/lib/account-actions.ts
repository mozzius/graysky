import { Alert } from "react-native";
import { showToastable } from "react-native-toastable";
import { type BskyAgent } from "@atproto/api";
import { type QueryClient } from "@tanstack/react-query";

export const muteAccount = (
  agent: BskyAgent,
  handle: string,
  did: string,
  queryClient?: QueryClient,
) => {
  void agent.mute(did).then(() => {
    if (queryClient) void queryClient.invalidateQueries(["profile"]);
    showToastable({
      title: "Muted",
      message: `You will no longer see posts from @${handle}`,
    });
  });
};

export const blockAccount = (
  agent: BskyAgent,
  handle: string,
  did: string,
  queryClient?: QueryClient,
) => {
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
        if (queryClient) void queryClient.invalidateQueries(["profile"]);
        showToastable({
          title: "Blocked",
          message: `@${handle} has been blocked`,
        });
      },
    },
  ]);
};
