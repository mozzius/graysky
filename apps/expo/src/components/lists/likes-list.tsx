import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useAgent } from "../../lib/agent";
import { PeopleList, type PeopleListRef } from "./people-list";

const useLikes = (post?: string) => {
  const agent = useAgent();

  return useInfiniteQuery({
    queryKey: ["likes", post],
    queryFn: async ({ pageParam }) => {
      if (!post) return { people: [], cursor: undefined };
      if (!agent.hasSession) throw new Error("Not logged in");
      const followers = await agent.getLikes({
        uri: post,
        cursor: pageParam as string | undefined,
      });
      if (!followers.success) throw new Error("Could not fetch follows");
      return {
        people: followers.data.likes.map((like) => like.actor),
        cursor: followers.data.cursor,
      };
    },
    enabled: !!post,
  });
};

export interface LikesListRef {
  open: (post: string) => void;
}

export const LikesList = forwardRef<LikesListRef>((_, ref) => {
  const listRef = useRef<PeopleListRef>(null);
  const [post, setPost] = useState<string | undefined>();
  const followers = useLikes(post);

  useImperativeHandle(ref, () => ({
    open: (post) => {
      setPost(post);
      listRef.current?.open();
    },
  }));

  return (
    <PeopleList
      title="Likes"
      ref={listRef}
      data={followers}
      onClose={() => setPost(undefined)}
    />
  );
});
LikesList.displayName = "LikesList";
