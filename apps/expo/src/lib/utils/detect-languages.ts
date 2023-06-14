import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  RichText,
  type Facet,
} from "@atproto/api";
import { produce } from "immer";

import { type api } from "./api";

const stripExtraneous = (text: string, facets?: Facet[]) => {
  const rt = new RichText({ text, facets });
  const stripped = [];

  // remove links and mentions
  for (const segment of rt.segments()) {
    if (!segment.isLink() && !segment.isMention()) {
      stripped.push(segment.text);
    }
  }

  text = stripped.join(" ");

  // remove emojis
  // https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
  text = text.replace(
    /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c\ude32-\ude3a]|[\ud83c\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/g,
    "",
  );

  // remove punctuation
  text = text.replace(/[.,\/#!$%\^&\*;:{}=_`~()]/g, "");

  return text;
};

export const addDetectedLanguages = async (
  feed: AppBskyFeedDefs.FeedViewPost[],
  cursor: string | undefined,
  detect: ReturnType<typeof api.translate.detect.useMutation>,
) => {
  try {
    const toBeDetected: { uri: string; text: string }[] = [];

    for (const post of feed) {
      if (AppBskyFeedPost.isRecord(post.post.record) && post.post.record.text) {
        const strippedText = stripExtraneous(
          post.post.record.text,
          post.post.record.facets,
        );

        if (strippedText.length > 1) {
          toBeDetected.push({
            uri: post.post.uri,
            text: strippedText,
          });
        }
      }
      if (
        post.reply &&
        AppBskyFeedDefs.isPostView(post.reply?.parent) &&
        AppBskyFeedPost.isRecord(post.reply.parent.record) &&
        post.reply.parent.record.text
      ) {
        const strippedText = stripExtraneous(
          post.reply.parent.record.text,
          post.reply.parent.record.facets,
        );

        if (strippedText.length > 1) {
          toBeDetected.push({
            uri: post.post.uri,
            text: strippedText,
          });
        }
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
