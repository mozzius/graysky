import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { type AtUriString } from "@atproto/lex";
import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useAgent } from "~/lib/agent";
import { PeopleList, type PeopleListRef } from "./people-list";

const useReposts = (post?: string) => {
  const agent = useAgent();

  return useInfiniteQuery({
    queryKey: ["reposts", post],
    queryFn: async ({ pageParam }) => {
      if (!post) return { people: [], cursor: undefined };
      if (!agent.did) throw new Error("Not logged in");
      const followers = await agent.call(app.bsky.feed.getRepostedBy, {
        uri: post as AtUriString,
        cursor: pageParam,
      });
      return {
        people: followers.repostedBy,
        cursor: followers.cursor,
      };
    },
    enabled: !!post,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });
};

export interface RepostsListRef {
  open: (post: string, limit?: number) => void;
}

export const RepostsList = forwardRef<RepostsListRef>((__, ref) => {
  const listRef = useRef<PeopleListRef>(null);
  const [post, setPost] = useState<string | undefined>();
  const [limit, setLimit] = useState<number | undefined>();
  const reposters = useReposts(post);
  const { _ } = useLingui();

  useImperativeHandle(ref, () => ({
    open: (post, limit) => {
      setPost(post);
      setLimit(limit);
      listRef.current?.open();
    },
  }));

  return (
    <PeopleList
      title={_(msg`Reposted by`)}
      ref={listRef}
      data={reposters}
      limit={limit}
    />
  );
});
RepostsList.displayName = "RepostsList";
