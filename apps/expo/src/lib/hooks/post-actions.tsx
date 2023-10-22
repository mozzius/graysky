import { useRef, useState } from "react";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useMutation } from "@tanstack/react-query";
import { QuoteIcon, RepeatIcon } from "lucide-react-native";

import { useComposer } from "~/lib/hooks/composer";
import { useAgent } from "../agent";
import { actionSheetStyles } from "../utils/action-sheet";
import { useHaptics } from "./preferences";

export const useLike = (
  post: AppBskyFeedDefs.FeedViewPost["post"],
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
          const like = await agent.like(post.uri, post.cid);
          setLikeUri(like.uri);
        } catch (err) {
          setLiked(false);
          console.warn(err);
        }
      } else {
        try {
          setLiked(false);
          await agent.deleteLike(likeUri);
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
  post: AppBskyFeedDefs.FeedViewPost["post"],
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
          const repost = await agent.repost(post.uri, post.cid);
          setRepostUri(repost.uri);
        } catch (err) {
          setReposted(false);
          console.warn(err);
        }
      } else {
        try {
          setReposted(false);
          await agent.deleteRepost(repostUri);
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
  post: AppBskyFeedDefs.PostView,
  reposted: boolean,
  toggleRepost: () => void,
  anchor?: number,
) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const composer = useComposer();

  const theme = useTheme();

  return () => {
    const options = [reposted ? "Undo Repost" : "Repost", "Quote", "Cancel"];
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
        if (index === undefined) return;
        switch (options[index]) {
          case "Repost":
          case "Undo Repost":
            toggleRepost();
            break;
          case "Quote":
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
