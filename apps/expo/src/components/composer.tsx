import { useRouter } from "expo-router";
import { type AppBskyFeedDefs, type AppBskyFeedPost } from "@atproto/api";
import { useQueryClient } from "@tanstack/react-query";

export const useComposer = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  return {
    open: () => router.push("/composer"),
    reply: (reply: {
      parent: AppBskyFeedDefs.PostView;
      root: AppBskyFeedDefs.PostView;
    }) => {
      queryClient.setQueryData(["context", reply.parent.uri], {
        post: reply.parent,
      } satisfies AppBskyFeedDefs.ThreadViewPost);
      router.push(
        `/composer?reply=${encodeURIComponent(
          JSON.stringify({
            parent: {
              uri: reply.parent.uri,
              cid: reply.parent.cid,
            },
            root: {
              uri: reply.root.uri,
              cid: reply.root.cid,
            },
          } satisfies AppBskyFeedPost.ReplyRef),
        )}`,
      );
    },
    quote: (post: AppBskyFeedDefs.PostView) =>
      router.push(
        `/composer?quote=${encodeURIComponent(
          JSON.stringify({
            uri: post.uri,
            cid: post.cid,
          }),
        )}`,
      ),
  };
};
