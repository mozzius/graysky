/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { type AtUriString } from "@atproto/lex";
import { app } from "@bsky/sdk/lexicons";
import { RichText } from "@bsky/sdk/richtext";
import { HeartIcon, MessageSquareIcon, RepeatIcon } from "lucide-react";

import { createPublicClient } from "~/lib/bsky";

interface Props {
  uri?: string;
}

const isPostRecord = (record: unknown): record is app.bsky.feed.post.Main =>
  app.bsky.feed.post.$matches(record, { strict: false });

const isThreadViewPost = (value: {
  $type?: string;
}): value is app.bsky.feed.defs.ThreadViewPost =>
  value.$type === app.bsky.feed.defs.threadViewPost.$type;

export const CommentSection = async ({ uri }: Props) => {
  if (!uri) return <p className="text-center">No comments</p>;

  const [, , did, _, rkey] = uri.split("/");

  const postUrl = `https://bsky.app/profile/${did}/post/${rkey}`;

  try {
    const thread = await getPostThread(uri);

    if (!thread.replies || thread.replies.length === 0) {
      return <p className="text-center">No comments yet</p>;
    }

    return (
      <div>
        <Link href={postUrl} target="_blank" rel="noreferrer noopener">
          <p className="hover:underline">
            {thread.post.likeCount ?? 0} likes - {thread.post.repostCount ?? 0}{" "}
            reposts
          </p>
        </Link>
        <h2 className="mt-6 text-xl font-bold">Comments</h2>
        <p className="mt-2 text-sm">
          Comments are fetched directly from{" "}
          <Link
            href={postUrl}
            className="underline"
            target="_blank"
            rel="noreferrer noopener"
          >
            this post
          </Link>{" "}
          - reply there to add your own comment.
        </p>
        <div className="mt-10 space-y-8">
          {thread.replies.sort(sortByLikes).map((reply) => {
            if (!isThreadViewPost(reply)) return null;
            return <Comment key={reply.post.uri} comment={reply} />;
          })}
        </div>
      </div>
    );
  } catch (err) {
    console.error(err);
    return <p className="text-center">Error loading comments</p>;
  }
};

const Comment = ({
  comment,
}: {
  comment: app.bsky.feed.defs.ThreadViewPost;
}) => {
  const author = comment.post.author;
  const avatarClassName = "h-4 w-4 shrink-0 rounded-full bg-gray-300";

  if (!isPostRecord(comment.post.record)) return null;

  const rt = new RichText({
    text: comment.post.record.text,
    facets: comment.post.record.facets,
  });

  const richText = [];

  let counter = 0;
  for (const segment of rt.segments()) {
    if (segment.isLink() && segment.link) {
      richText.push(
        <Link
          key={counter}
          href={segment.link.uri}
          target="_blank"
          rel="noreferrer noopener"
          className="text-blue-400 hover:underline"
        >
          {segment.text}
        </Link>,
      );
    } else if (segment.isMention() && segment.mention) {
      richText.push(
        <Link
          key={counter}
          href={`https://bsky.app/profile/${segment.mention.did}`}
          target="_blank"
          rel="noreferrer noopener"
          className="text-blue-400 hover:underline"
        >
          {segment.text}
        </Link>,
      );
    } else {
      richText.push(segment.text);
    }

    counter++;
  }

  return (
    <div className="my-4 text-sm">
      <div className="flex max-w-xl flex-col gap-2">
        <Link
          className="flex flex-row items-center gap-2 hover:underline"
          href={`https://bsky.app/profile/${author.did}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          {author.avatar ? (
            <img
              src={comment.post.author.avatar}
              alt="avatar"
              className={avatarClassName}
            />
          ) : (
            <div className={avatarClassName} />
          )}
          <p className="line-clamp-1">
            {author.displayName ?? author.handle}{" "}
            <span className="text-gray-500">@{author.handle}</span>
          </p>
        </Link>
        <Link
          href={`https://bsky.app/profile/${author.did}/post/${comment.post.uri.split("/").pop()}`}
          target="_blank"
          rel="noreferrer noopener"
        >
          <p>{richText}</p>
          <Actions post={comment.post} />
        </Link>
      </div>
      {comment.replies && comment.replies.length > 0 && (
        <div className="border-l-2 border-neutral-600 pl-2">
          {comment.replies.sort(sortByLikes).map((reply) => {
            if (!isThreadViewPost(reply)) return null;
            return <Comment key={reply.post.uri} comment={reply} />;
          })}
        </div>
      )}
    </div>
  );
};

const Actions = ({ post }: { post: app.bsky.feed.defs.PostView }) => (
  <div className="mt-2 flex w-full max-w-[150px] flex-row items-center justify-between opacity-60">
    <div className="flex flex-row items-center gap-1.5">
      <MessageSquareIcon color="white" size={14} />
      <p className="text-xs">{post.replyCount ?? 0}</p>
    </div>
    <div className="flex flex-row items-center gap-1.5">
      <RepeatIcon color="white" size={14} />
      <p className="text-xs">{post.repostCount ?? 0}</p>
    </div>
    <div className="flex flex-row items-center gap-1.5">
      <HeartIcon color="white" size={14} />
      <p className="text-xs">{post.likeCount ?? 0}</p>
    </div>
  </div>
);

const getPostThread = async (uri: string) => {
  const data = await createPublicClient({ cache: "no-store" }).call(
    app.bsky.feed.getPostThread,
    { uri: uri as AtUriString },
  );

  if (!isThreadViewPost(data.thread)) {
    throw new Error("Could not find thread");
  }

  return data.thread;
};

type Reply = NonNullable<app.bsky.feed.defs.ThreadViewPost["replies"]>[number];

const sortByLikes = (a: Reply, b: Reply) => {
  if (!isThreadViewPost(a) || !isThreadViewPost(b)) {
    // blocked/deleted posts are just ignored, so don't sort
    return 0;
  }
  return (b.post.likeCount ?? 0) - (a.post.likeCount ?? 0);
};
