import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useAgent } from "../../lib/agent";
import { PeopleList, type PeopleListRef } from "./people-list";

const useFollowers = (actor?: string) => {
  const agent = useAgent();

  return useInfiniteQuery({
    queryKey: ["followers", actor],
    queryFn: async ({ pageParam }) => {
      if (!actor) return { people: [], cursor: undefined };
      if (!agent.hasSession) throw new Error("Not logged in");
      const followers = await agent.getFollowers({
        actor,
        cursor: pageParam as string | undefined,
      });
      if (!followers.success) throw new Error("Could not fetch followers");
      return {
        people: followers.data.followers,
        cursor: followers.data.cursor,
      };
    },
    enabled: !!actor,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });
};

export interface FollowersListRef {
  open: (actor: string) => void;
}

export const FollowersList = forwardRef<FollowersListRef>((_, ref) => {
  const listRef = useRef<PeopleListRef>(null);
  const [actor, setActor] = useState<string | undefined>();
  const followers = useFollowers(actor);

  useImperativeHandle(ref, () => ({
    open: (actor) => {
      setActor(actor);
      listRef.current?.open();
    },
  }));

  return (
    <PeopleList
      title="Followers"
      ref={listRef}
      data={followers}
      onClose={() => setActor(undefined)}
    />
  );
});
FollowersList.displayName = "FollowersList";
