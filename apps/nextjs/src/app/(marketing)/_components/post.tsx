/* eslint-disable @next/next/no-img-element */
import { AppBskyFeedPost, type AppBskyFeedDefs } from "@atproto/api";
import { HeartIcon, MessageSquareIcon, RepeatIcon } from "lucide-react";

interface Props {
  data: AppBskyFeedDefs.PostView;
}

export const Post = ({ data: post }: Props) => {
  return (
    <a
      href={`https://bsky.app/profile/${post.author.handle}/post/${post.uri
        .split("/")
        .pop()}`}
      key={post.uri}
      target="_blank"
      rel="noreferrer"
      className="mb-4 flex break-inside-avoid flex-col gap-3 rounded border border-neutral-600 p-3 transition-colors hover:bg-neutral-800"
    >
      <div className="flex flex-row items-center">
        <img
          src={post.author.avatar}
          alt={`${post.author.handle}'s avatar`}
          className="mr-3 h-8 w-8 shrink-0 rounded-full"
        />
        <div>
          {post.author.displayName && (
            <p className="line-clamp-1 text-sm font-medium">
              {post.author.displayName}
            </p>
          )}
          <p className="line-clamp-1 text-xs opacity-40">
            @{post.author.handle}
          </p>
        </div>
      </div>
      {AppBskyFeedPost.isRecord(post.record) && (
        <p className="text-sm opacity-90">{post.record.text}</p>
      )}
      <div className="flex w-3/4 flex-row items-center justify-between opacity-60">
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
    </a>
  );
};
