import { useRef, useState } from "react";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useMutation } from "@tanstack/react-query";

import { useAuthedAgent } from "./agent";

export const useLike = (post: AppBskyFeedDefs.FeedViewPost["post"]) => {
  const agent = useAuthedAgent();
  const cid = useRef(post.cid);

  const [liked, setLiked] = useState(!!post.viewer?.like);
  const [likeUri, setLikeUri] = useState(post.viewer?.like);

  // reset like/repost state if cid changes
  if (post.cid !== cid.current) {
    cid.current = post.cid;
    setLiked(!!post.viewer?.like);
    setLikeUri(post.viewer?.like);
  }

  const toggleLike = useMutation({
    mutationKey: ["like", post.uri],
    mutationFn: async () => {
      if (!likeUri) {
        try {
          setLiked(true);
          const like = await agent.like(post.uri, post.cid);
          setLikeUri(like.uri);
        } catch (err) {
          setLiked(false);
          console.log(err);
        }
      } else {
        try {
          setLiked(false);
          await agent.deleteLike(likeUri);
          setLikeUri(undefined);
        } catch (err) {
          setLiked(true);
          console.log(err);
        }
      }
    },
  });

  return {
    liked,
    likeCount:
      (post.likeCount ?? 0) + (liked && likeUri !== post.viewer?.like ? 1 : 0),
    toggleLike,
  };
};

export const useRepost = (post: AppBskyFeedDefs.FeedViewPost["post"]) => {
  const agent = useAuthedAgent();
  const cid = useRef(post.cid);

  const [reposted, setReposted] = useState(!!post.viewer?.repost);
  const [repostUri, setRepostUri] = useState(post.viewer?.repost);

  // reset like/repost state if cid changes
  if (post.cid !== cid.current) {
    cid.current = post.cid;
    setReposted(!!post.viewer?.repost);
    setRepostUri(post.viewer?.repost);
  }

  const toggleRepost = useMutation({
    mutationKey: ["repost", post.uri],
    mutationFn: async () => {
      if (!repostUri) {
        try {
          setReposted(true);
          const repost = await agent.repost(post.uri, post.cid);
          setRepostUri(repost.uri);
        } catch (err) {
          setReposted(false);
          console.log(err);
        }
      } else {
        try {
          setReposted(false);
          await agent.deleteRepost(repostUri);
          setRepostUri(undefined);
        } catch (err) {
          setReposted(true);
          console.log(err);
        }
      }
    },
  });

  return {
    reposted,
    repostCount:
      (post.repostCount ?? 0) +
      (reposted && repostUri !== post.viewer?.repost ? 1 : 0),
    toggleRepost,
  };
};
