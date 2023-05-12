import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../../lib/agent";
import { PeopleList, type PeopleListRef } from "./people-list";

const useFollows = (actor?: string) => {
  const agent = useAuthedAgent();

  return useInfiniteQuery({
    queryKey: ["follows", actor],
    queryFn: async ({ pageParam }) => {
      if (!actor) return { people: [], cursor: undefined };
      const followers = await agent.getFollows({
        actor,
        cursor: pageParam as string | undefined,
      });
      if (!followers.success) throw new Error("Could not fetch follows");
      return {
        people: followers.data.follows,
        cursor: followers.data.cursor,
      };
    },
    enabled: !!actor,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });
};

export interface FollowsListRef {
  open: (actor: string) => void;
}

export const FollowsList = forwardRef<FollowsListRef>((_, ref) => {
  const listRef = useRef<PeopleListRef>(null);
  const [actor, setActor] = useState<string | undefined>();
  const followers = useFollows(actor);

  useImperativeHandle(ref, () => ({
    open: (actor) => {
      setActor(actor);
      listRef.current?.open();
    },
  }));

  return (
    <PeopleList
      title="Following"
      ref={listRef}
      data={followers}
      onClose={() => setActor(undefined)}
    />
  );
});
FollowsList.displayName = "FollowsList";
