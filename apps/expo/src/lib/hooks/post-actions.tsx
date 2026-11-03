import { useRef, useState } from "react";
import { useTheme } from "expo-router/react-navigation";
import { deleteLike, deleteRepost, like, repost } from "@bsky/sdk";
import { app } from "@bsky/sdk/lexicons";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useMutation } from "@tanstack/react-query";
import { QuoteIcon, RepeatIcon } from "lucide-react-native";

import { useComposer } from "~/lib/composer/utils";
import { useAgent } from "../agent";
import { actionSheetStyles } from "../utils/action-sheet";
import { useHaptics } from "./preferences";

export const useLike = (
  post: app.bsky.feed.defs.FeedViewPost["post"],
  updated: number,
) => {
  const agent = useAgent();
  const cid = useRef(post.cid);
  const lastUpdate = useRef(updated);
  const haptics = useHaptics();

  const [liked, setLiked] = useState(!!post.viewer?.like);
  const [likeUri, setLikeUri] = useState(post.viewer?.like);

  const toggleLike = useMutation({
    onMutate: () => haptics.impact(),
    mutationKey: ["like", post.uri],
    mutationFn: async () => {
      if (!likeUri) {
        try {
          setLiked(true);
          const result = await agent.call(like, {
            uri: post.uri,
            cid: post.cid,
          });
          setLikeUri(result.uri);
        } catch (err) {
          setLiked(false);
          console.warn(err);
        }
      } else {
        try {
          setLiked(false);
          await agent.call(deleteLike, likeUri);
          setLikeUri(undefined);
        } catch (err) {
          setLiked(true);
          console.warn(err);
        }
      }
    },
  });

  // reset like/repost state if cid or timestamp changes
  if (post.cid !== cid.current || updated !== lastUpdate.current) {
    cid.current = post.cid;
    lastUpdate.current = updated;
    setLiked(!!post.viewer?.like);
    setLikeUri(post.viewer?.like);
    toggleLike.reset();
  }

  return {
    liked,
    likeCount:
      (post.likeCount ?? 0) + (liked && likeUri !== post.viewer?.like ? 1 : 0),
    toggleLike,
  };
};

export const useRepost = (
  post: app.bsky.feed.defs.FeedViewPost["post"],
  updated: number,
) => {
  const agent = useAgent();
  const cid = useRef(post.cid);
  const lastUpdate = useRef(updated);
  const haptics = useHaptics();

  const [reposted, setReposted] = useState(!!post.viewer?.repost);
  const [repostUri, setRepostUri] = useState(post.viewer?.repost);

  const toggleRepost = useMutation({
    onMutate: () => haptics.impact(),
    mutationKey: ["repost", post.uri],
    mutationFn: async () => {
      if (!repostUri) {
        try {
          setReposted(true);
          const result = await agent.call(repost, {
            uri: post.uri,
            cid: post.cid,
          });
          setRepostUri(result.uri);
        } catch (err) {
          setReposted(false);
          console.warn(err);
        }
      } else {
        try {
          setReposted(false);
          await agent.call(deleteRepost, repostUri);
          setRepostUri(undefined);
        } catch (err) {
          setReposted(true);
          console.warn(err);
        }
      }
    },
  });

  // reset like/repost state if cid or timestamp changes
  if (post.cid !== cid.current || updated !== lastUpdate.current) {
    cid.current = post.cid;
    lastUpdate.current = updated;
    setReposted(!!post.viewer?.repost);
    setRepostUri(post.viewer?.repost);
    toggleRepost.reset();
  }

  return {
    reposted,
    repostCount:
      (post.repostCount ?? 0) +
      (reposted && repostUri !== post.viewer?.repost ? 1 : 0),
    toggleRepost,
  };
};

export const useHandleRepost = (
  post: app.bsky.feed.defs.PostView,
  reposted: boolean,
  toggleRepost: () => void,
  anchor?: number,
) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const composer = useComposer();
  const { _ } = useLingui();

  const theme = useTheme();

  return () => {
    const options = [
      reposted ? _(msg`Undo Repost`) : _(msg`Repost`),
      _(msg`Quote`),
      _(msg`Cancel`),
    ];
    const icons = [
      <RepeatIcon key={0} size={24} color={theme.colors.text} />,
      <QuoteIcon key={1} size={24} color={theme.colors.text} />,
      <></>,
    ];
    showActionSheetWithOptions(
      {
        options,
        icons,
        cancelButtonIndex: options.length - 1,
        anchor,
        ...actionSheetStyles(theme),
      },
      (index) => {
        switch (index) {
          case 0:
            toggleRepost();
            break;
          case 1:
            composer.quote({
              uri: post.uri,
              cid: post.cid,
            });
            break;
        }
      },
    );
  };
};
