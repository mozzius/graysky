import { useMemo } from "react";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";

import { ProfileList } from "~/components/profile-list";
import { QueryWithoutData } from "~/components/query-without-data";
import { useAgent } from "~/lib/agent";
import { useRefreshOnFocus } from "~/lib/utils/query";

export default function BlockedUsers() {
  const agent = useAgent();
  const router = useRouter();

  const blocks = useInfiniteQuery({
    queryKey: ["blocks"],
    queryFn: async ({ pageParam }) => {
      const blocks = await agent.app.bsky.graph.getBlocks({
        cursor: pageParam,
      });
      if (!blocks.success) throw new Error("ブロックを取得できませんでした");
      return blocks.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  useRefreshOnFocus(blocks.refetch);

  const data = useMemo(() => {
    if (!blocks.data) return [];
    return blocks.data.pages.flatMap((x) => x.blocks);
  }, [blocks.data]);

  if (blocks.data) {
    return (
      <ProfileList
        profiles={data}
        onProfilePress={(evt) => {
          evt.preventDefault();
          router.push(`/(feeds)/profile/${evt.person.did}`);
        }}
        emptyText="誰もブロックしていません"
      />
    );
  }

  return <QueryWithoutData query={blocks} />;
}
