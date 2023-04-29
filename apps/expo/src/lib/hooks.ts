/* eslint-disable @typescript-eslint/no-empty-function */
import { useEffect, useRef, useState } from "react";
import { Alert, Linking, Share } from "react-native";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useNavigation } from "expo-router";
import {
  AppBskyFeedPost,
  ComAtprotoModerationDefs,
  type AppBskyFeedDefs,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { type FlashList } from "@shopify/flash-list";
import { useMutation } from "@tanstack/react-query";

import { useAuthedAgent } from "./agent";
import { queryClient } from "./query-client";
import { assert } from "./utils/assert";

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
      void Haptics.impactAsync();
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
      void Haptics.impactAsync();
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

  return {
    reposted,
    repostCount:
      (post.repostCount ?? 0) +
      (reposted && repostUri !== post.viewer?.repost ? 1 : 0),
    toggleRepost,
  };
};

export const useTabPressScroll = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ref: React.RefObject<FlashList<any>>,
  callback = () => {},
) => {
  const navigation = useNavigation();

  useEffect(() => {
    // @ts-expect-error doesn't know what kind of navigator it is
    const unsub = navigation.addListener("tabPress", () => {
      if (navigation.isFocused()) {
        ref.current?.scrollToOffset({
          offset: 0,
          animated: true,
        });
        callback();
      }
    });

    return unsub;
  }, [callback, navigation, ref]);
};

export const useTabPressScrollRef = (callback = () => {}) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<FlashList<any>>(null);

  useTabPressScroll(ref, callback);

  return ref;
};

export const usePostViewOptions = (post: AppBskyFeedDefs.PostView) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const agent = useAuthedAgent();
  const handleMore = () => {
    const options =
      post.author.handle === agent.session.handle
        ? ["Translate", "Copy post text", "Share post", "Delete post", "Cancel"]
        : [
            "Translate",
            "Copy post text",
            "Share post",
            `Mute @${post.author.handle}`,
            `Block @${post.author.handle}`,
            "Report post",
            "Cancel",
          ];
    showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1 },
      async (index) => {
        if (index === undefined) return;
        switch (options[index]) {
          case "Translate":
            if (!AppBskyFeedPost.isRecord(post.record)) return;
            assert(AppBskyFeedPost.validateRecord(post.record));
            await Linking.openURL(
              `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(
                post.record.text,
              )}`,
            );
            break;
          case "Copy post text":
            if (!AppBskyFeedPost.isRecord(post.record)) return;
            assert(AppBskyFeedPost.validateRecord(post.record));
            await Clipboard.setStringAsync(post.record.text);
            break;
          case "Share post":
            await Share.share({
              message: `https://psky.app/profile/${
                post.author.handle
              }/post/${post.uri.split("/").pop()}`,
              url: `https://psky.app/profile/${
                post.author.handle
              }/post/${post.uri.split("/").pop()}`,
            });
            break;
          case `Mute @${post.author.handle}`:
            await agent.mute(post.author.did);
            Alert.alert(
              "Muted",
              `You will no longer see posts from @${post.author.handle}.`,
            );
            break;
          case `Block @${post.author.handle}`:
            // to do - see if this works
            await agent.app.bsky.graph.block.create(
              { repo: agent.session.did },
              {
                createdAt: new Date().toISOString(),
                subject: post.author.did,
              },
            );
            Alert.alert("Blocked", `@${post.author.handle} has been blocked.`);
            break;
          case "Delete post":
            await agent.deletePost(post.uri);
            Alert.alert("Deleted", "Your post has been deleted.");
            await queryClient.invalidateQueries();
            break;
          case "Report post":
            // prettier-ignore
            const reportOptions = [
            { label: "Spam", value: ComAtprotoModerationDefs.REASONSPAM },
            { label: "Copyright Violation", value: ComAtprotoModerationDefs.REASONVIOLATION },
            { label: "Misleading", value: ComAtprotoModerationDefs.REASONMISLEADING },
            { label: "Unwanted Sexual Content", value: ComAtprotoModerationDefs.REASONSEXUAL },
            { label: "Rude", value: ComAtprotoModerationDefs.REASONRUDE },
            { label: "Other", value: ComAtprotoModerationDefs.REASONOTHER },
            { label: "Cancel", value: "Cancel" },
          ] as const;
            showActionSheetWithOptions(
              {
                options: reportOptions.map((x) => x.label),
                cancelButtonIndex: reportOptions.length - 1,
              },
              async (index) => {
                if (index === undefined) return;
                const reason = reportOptions[index]!.value;
                if (reason === "Cancel") return;
                await agent.createModerationReport({
                  reasonType: reason,
                  subject: {
                    uri: post.uri,
                    cid: post.cid,
                  },
                });
                Alert.alert(
                  "Report submitted",
                  "Thank you for making the skyline a safer place.",
                );
              },
            );
            break;
        }
      },
    );
  };

  return handleMore;
};
