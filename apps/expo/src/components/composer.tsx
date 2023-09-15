import { useRouter } from "expo-router";
import {
  AppBskyFeedPost,
  type AppBskyFeedDefs,
  type ComAtprotoRepoStrongRef,
} from "@atproto/api";
import { useQueryClient } from "@tanstack/react-query";

const getReplyRef = (post: AppBskyFeedDefs.PostView) => {
  if (AppBskyFeedPost.isRecord(post.record)) {
    return post.record.reply;
  }
};

export const useComposer = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return {
    open: () => router.push("/composer"),
    reply: (post: AppBskyFeedDefs.PostView) => {
      queryClient.setQueryData(["context", post.uri], {
        post,
      } satisfies AppBskyFeedDefs.ThreadViewPost);

      const parent = {
        uri: post.uri,
        cid: post.cid,
      } satisfies ComAtprotoRepoStrongRef.Main;

      const root = getReplyRef(post)?.root ?? parent;

      const replyRef = {
        parent,
        root,
      } satisfies AppBskyFeedPost.ReplyRef;

      router.push(
        `/composer?reply=${encodeURIComponent(JSON.stringify(replyRef))}`,
      );
    },
    quote: (ref: ComAtprotoRepoStrongRef.Main) =>
      router.push(`/composer?quote=${encodeURIComponent(JSON.stringify(ref))}`),
  };
};
