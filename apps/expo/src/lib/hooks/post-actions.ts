import { useRef, useState } from "react";
import { Alert, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import {
  AppBskyFeedPost,
  ComAtprotoModerationDefs,
  type AppBskyFeedDefs,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useComposer } from "../../components/composer";
import { useLists } from "../../components/lists/context";
import { blockAccount, muteAccount } from "../account-actions";
import { useAuthedAgent } from "../agent";
import { assert } from "../utils/assert";
import { useColorScheme } from "../utils/color-scheme";

export const useLike = (
  post: AppBskyFeedDefs.FeedViewPost["post"],
  updated: number,
) => {
  const agent = useAuthedAgent();
  const cid = useRef(post.cid);
  const lastUpdate = useRef(updated);

  const [liked, setLiked] = useState(!!post.viewer?.like);
  const [likeUri, setLikeUri] = useState(post.viewer?.like);

  const toggleLike = useMutation({
    onMutate: () => void Haptics.impactAsync(),
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
  const agent = useAuthedAgent();
  const cid = useRef(post.cid);
  const lastUpdate = useRef(updated);

  const [reposted, setReposted] = useState(!!post.viewer?.repost);
  const [repostUri, setRepostUri] = useState(post.viewer?.repost);

  const toggleRepost = useMutation({
    onMutate: () => void Haptics.impactAsync(),
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
) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const composer = useComposer();
  const { colorScheme } = useColorScheme();

  return () => {
    const options = [reposted ? "Unrepost" : "Repost", "Quote", "Cancel"];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
        userInterfaceStyle: colorScheme,
      },
      (index) => {
        if (index === undefined) return;
        switch (options[index]) {
          case "Repost":
          case "Unrepost":
            toggleRepost();
            break;
          case "Quote":
            composer.quote(post);
            break;
        }
      },
    );
  };
};
