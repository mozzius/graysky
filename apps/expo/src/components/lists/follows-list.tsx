import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { useAgent } from "~/lib/agent";
import { PeopleList, type PeopleListRef } from "./people-list";

const useFollows = (actor?: string) => {
  const agent = useAgent();

  return useInfiniteQuery({
    queryKey: ["follows", actor],
    queryFn: async ({ pageParam }) => {
      if (!actor) return { people: [], cursor: undefined };
      if (!agent.hasSession) throw new Error("Not logged in");
      const followers = await agent.getFollows({
        actor,
        cursor: pageParam,
      });
      if (!followers.success) throw new Error("Could not fetch follows");
      return {
        people: followers.data.follows,
        cursor: followers.data.cursor,
      };
    },
    enabled: !!actor,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });
};

export interface FollowsListRef {
  open: (actor: string, limit?: number) => void;
}

export const FollowsList = forwardRef<FollowsListRef>((__, ref) => {
  const listRef = useRef<PeopleListRef>(null);
  const [actor, setActor] = useState<string | undefined>();
  const [limit, setLimit] = useState<number | undefined>();
  const followers = useFollows(actor);
  const { _ } = useLingui();

  useImperativeHandle(ref, () => ({
    open: (actor, limit) => {
      setActor(actor);
      setLimit(limit);
      listRef.current?.open();
    },
  }));

  return (
    <PeopleList
      title={_(msg`Following`)}
      ref={listRef}
      data={followers}
      limit={limit}
    />
  );
});
FollowsList.displayName = "FollowsList";
