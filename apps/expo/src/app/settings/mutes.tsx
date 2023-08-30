import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

import { ProfileList } from "~/components/profile-list";
import { QueryWithoutData } from "~/components/query-without-data";
import { useAgent } from "~/lib/agent";
import { useRefreshOnFocus } from "~/lib/utils/query";

export default function MutedUsers() {
  const agent = useAgent();

  const mutes = useInfiniteQuery({
    queryKey: ["mutes"],
    queryFn: async ({ pageParam }) => {
      const mutes = await agent.app.bsky.graph.getMutes({
        cursor: pageParam as string | undefined,
      });
      if (!mutes.success) throw new Error("Could not fetch mutes");
      return mutes.data;
    },
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  useRefreshOnFocus(mutes.refetch);

  const data = useMemo(() => {
    if (!mutes.data) return [];
    return mutes.data.pages.flatMap((x) => x.mutes);
  }, [mutes.data]);

  if (mutes.data) {
    return <ProfileList profiles={data} emptyText="You haven't muted anyone" />;
  }

  return <QueryWithoutData query={mutes} />;
}
