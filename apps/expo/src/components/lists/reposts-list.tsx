import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useAgent } from "../../lib/agent";
import { PeopleList, type PeopleListRef } from "./people-list";

const useReposts = (post?: string) => {
  const agent = useAgent();

  return useInfiniteQuery({
    queryKey: ["reposts", post],
    queryFn: async ({ pageParam }) => {
      if (!post) return { people: [], cursor: undefined };
      if (!agent.hasSession) throw new Error("Not logged in");
      const followers = await agent.getRepostedBy({
        uri: post,
        cursor: pageParam as string | undefined,
      });
      if (!followers.success) throw new Error("Could not fetch follows");
      return {
        people: followers.data.repostedBy,
        cursor: followers.data.cursor,
      };
    },
    enabled: !!post,
  });
};

export interface RepostsListRef {
  open: (post: string) => void;
}

export const RepostsList = forwardRef<RepostsListRef>((_, ref) => {
  const listRef = useRef<PeopleListRef>(null);
  const [post, setPost] = useState<string | undefined>();
  const reposters = useReposts(post);

  useImperativeHandle(ref, () => ({
    open: (post) => {
      setPost(post);
      listRef.current?.open();
    },
  }));

  return (
    <PeopleList
      title="Reposted by"
      ref={listRef}
      data={reposters}
      onClose={() => setPost(undefined)}
    />
  );
});
RepostsList.displayName = "RepostsList";
