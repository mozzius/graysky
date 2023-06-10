import { AppBskyFeedDefs, AppBskyFeedPost } from "@atproto/api";
import { produce } from "immer";
import { z } from "zod";

import { type api } from "./api";

const isEmoji = (text: string) => z.string().emoji().safeParse(text).success;

export const addDetectedLanguages = async (
  feed: AppBskyFeedDefs.FeedViewPost[],
  cursor: string | undefined,
  detect: ReturnType<typeof api.translate.detect.useMutation>,
) => {
  try {
    const toBeDetected: { uri: string; text: string }[] = [];

    for (const post of feed) {
      if (
        AppBskyFeedPost.isRecord(post.post.record) &&
        post.post.record.text &&
        !isEmoji(post.post.record.text)
      ) {
        toBeDetected.push({
          uri: post.post.uri,
          text: post.post.record.text,
        });
      }
      if (
        post.reply &&
        AppBskyFeedDefs.isPostView(post.reply?.parent) &&
        AppBskyFeedPost.isRecord(post.reply.parent.record) &&
        post.reply.parent.record.text &&
        !isEmoji(post.reply.parent.record.text)
      ) {
        toBeDetected.push({
          uri: post.reply.parent.uri,
          text: post.reply.parent.record.text,
        });
      }
    }

    if (toBeDetected.length === 0) return { cursor, feed };

    const languages = await detect.mutateAsync(toBeDetected);

    return {
      cursor,
      feed: feed.map((post) =>
        produce(post, (draft) => {
          if (languages[draft.post.uri]) {
            draft.post.language = languages[draft.post.uri];
          }
          if (
            draft.reply &&
            AppBskyFeedDefs.isPostView(draft.reply.parent) &&
            languages[draft.reply.parent.uri]
          ) {
            draft.reply.parent.language = languages[draft.reply.parent.uri];
          }
        }),
      ),
    };
  } catch (err) {
    console.error(err);
    return {
      cursor,
      feed,
    };
  }
};
