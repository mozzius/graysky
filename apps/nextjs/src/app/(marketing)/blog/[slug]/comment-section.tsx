/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  RichText,
  type AppBskyFeedGetPostThread,
} from "@atproto/api";
import * as Sentry from "@sentry/nextjs";
import { HeartIcon, MessageSquareIcon, RepeatIcon } from "lucide-react";

interface Props {
  uri?: string;
}

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
            if (!AppBskyFeedDefs.isThreadViewPost(reply)) return null;
            return <Comment key={reply.post.uri} comment={reply} />;
          })}
        </div>
      </div>
    );
  } catch (err) {
    Sentry.captureException(err);
    return <p className="text-center">Error loading comments</p>;
  }
};

const Comment = ({ comment }: { comment: AppBskyFeedDefs.ThreadViewPost }) => {
  const author = comment.post.author;
  const avatarClassName = "h-4 w-4 shrink-0 rounded-full bg-gray-300";

  if (!AppBskyFeedPost.isRecord(comment.post.record)) return null;

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
            if (!AppBskyFeedDefs.isThreadViewPost(reply)) return null;
            return <Comment key={reply.post.uri} comment={reply} />;
          })}
        </div>
      )}
    </div>
  );
};

const Actions = ({ post }: { post: AppBskyFeedDefs.PostView }) => (
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
  const params = new URLSearchParams({ uri });

  const res = await fetch(
    "https://public.api.bsky.app/xrpc/app.bsky.feed.getPostThread?" +
      params.toString(),
    {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    },
  );

  if (!res.ok) {
    console.error(await res.text());
    throw new Error("Failed to fetch post thread");
  }

  const data = (await res.json()) as AppBskyFeedGetPostThread.OutputSchema;

  if (!AppBskyFeedDefs.isThreadViewPost(data.thread)) {
    throw new Error("Could not find thread");
  }

  return data.thread;
};

const sortByLikes = (a: unknown, b: unknown) => {
  if (
    !AppBskyFeedDefs.isThreadViewPost(a) ||
    !AppBskyFeedDefs.isThreadViewPost(b)
  ) {
    // blocked/deleted posts are just ignored, so don't sort
    return 0;
  }
  return (b.post.likeCount ?? 0) - (a.post.likeCount ?? 0);
};
