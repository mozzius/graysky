import { useCallback } from "react";
import { Alert } from "react-native";
import { showToastable } from "react-native-toastable";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useQueryClient } from "@tanstack/react-query";

import { useAgent } from "./agent";

export const useAccountActions = () => {
  const muteAccount = useMuteAccount();
  const unmuteAccount = useUnmuteAccount();
  const blockAccount = useBlockAccount();
  const unblockAccount = useUnblockAccount();

  return {
    muteAccount,
    unmuteAccount,
    blockAccount,
    unblockAccount,
  };
};

export const useMuteAccount = () => {
  const queryClient = useQueryClient();
  const { _ } = useLingui();
  const agent = useAgent();

  return useCallback(
    (did: string, handle: string) => {
      void agent.mute(did).then(() => {
        void queryClient.invalidateQueries({ queryKey: ["profile", did] });
        showToastable({
          title: _(msg`Muted`),
          message: _(msg`You will no longer see posts from @${handle}`),
        });
      });
    },
    [agent, queryClient, _],
  );
};

export const useUnmuteAccount = () => {
  const queryClient = useQueryClient();
  const { _ } = useLingui();
  const agent = useAgent();

  return useCallback(
    (did: string, handle: string) => {
      void agent.unmute(did).then(() => {
        void queryClient.invalidateQueries({ queryKey: ["profile", did] });
        showToastable({
          title: _(msg`Unmuted`),
          message: _(msg`@${handle} is no longer muted`),
        });
      });
    },
    [agent, queryClient, _],
  );
};

export const useBlockAccount = () => {
  const queryClient = useQueryClient();
  const { _ } = useLingui();
  const agent = useAgent();

  return useCallback(
    (did: string, handle: string) => {
      Alert.alert(
        _(msg`Block`),
        _(msg`Are you sure you want to block @${handle}?`),
        [
          {
            text: _(msg`Cancel`),
            style: "cancel",
          },
          {
            text: _(msg`Block`),
            style: "destructive",
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress: async () => {
              if (!agent.session)
                throw new Error("No session when trying to block someone");
              await agent.app.bsky.graph.block.create(
                { repo: agent.session.did },
                {
                  createdAt: new Date().toISOString(),
                  subject: did,
                },
              );
              if (queryClient)
                void queryClient.invalidateQueries({
                  queryKey: ["profile", did],
                });
              showToastable({
                title: _(msg`Blocked`),
                message: _(msg`@${handle} has been blocked`),
              });
            },
          },
        ],
      );
    },
    [agent, queryClient, _],
  );
};

export const useUnblockAccount = () => {
  const queryClient = useQueryClient();
  const { _ } = useLingui();
  const agent = useAgent();

  return useCallback(
    (did: string, handle: string, rkey: string) => {
      Alert.alert(
        _(msg`Unblock`),
        _(msg`Are you sure you want to unblock @${handle}?`),
        [
          {
            text: _(msg`Cancel`),
            style: "cancel",
          },
          {
            text: _(msg`Unblock`),
            style: "destructive",
            // eslint-disable-next-line @typescript-eslint/no-misused-promises
            onPress: async () => {
              if (!agent.session)
                throw new Error("No session when trying to unblock someone");
              await agent.app.bsky.graph.block.delete(
                {
                  repo: agent.session.did,
                  rkey,
                },
                {},
              );
              if (queryClient)
                void queryClient.invalidateQueries({
                  queryKey: ["profile", did],
                });
              showToastable({
                title: _(msg`Unblocked`),
                message: _(msg`@${handle} has been unblocked`),
              });
            },
          },
        ],
      );
    },
    [agent, queryClient, _],
  );
};
