import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { ProfileList } from "../../components/profile-list";
import { QueryWithoutData } from "../../components/query-without-data";
import { useAuthedAgent } from "../../lib/agent";

export default function BlockedUsers() {
  const agent = useAuthedAgent();

  const blocks = useInfiniteQuery({
    queryKey: ["blocks"],
    queryFn: async ({ pageParam }) => {
      const blocks = await agent.app.bsky.graph.getBlocks({
        cursor: pageParam as string | undefined,
      });
      if (!blocks.success) throw new Error("Could not fetch blocks");
      return blocks.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  const data = useMemo(() => {
    if (!blocks.data) return [];
    return blocks.data.pages.flatMap((x) => x.blocks);
  }, [blocks.data]);

  if (blocks.data) {
    return <ProfileList profiles={data} />;
  }

  return <QueryWithoutData query={blocks} />;
}
