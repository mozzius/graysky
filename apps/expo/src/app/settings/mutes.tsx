import { useMemo } from "react";
import { useRouter } from "expo-router";
import { useInfiniteQuery } from "@tanstack/react-query";

import { ProfileList } from "~/components/profile-list";
import { QueryWithoutData } from "~/components/query-without-data";
import { useAgent } from "~/lib/agent";
import { useRefreshOnFocus } from "~/lib/utils/query";

export default function MutedUsers() {
  const agent = useAgent();
  const router = useRouter();

  const mutes = useInfiniteQuery({
    queryKey: ["mutes"],
    queryFn: async ({ pageParam }) => {
      const mutes = await agent.app.bsky.graph.getMutes({
        cursor: pageParam,
      });
      if (!mutes.success) throw new Error("ミュートを取得できませんでした");
      return mutes.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.cursor,
  });

  useRefreshOnFocus(mutes.refetch);

  const data = useMemo(() => {
    if (!mutes.data) return [];
    return mutes.data.pages.flatMap((x) => x.mutes);
  }, [mutes.data]);

  if (mutes.data) {
    return (
      <ProfileList
        profiles={data}
        onProfilePress={(evt) => {
          evt.preventDefault();
          router.push(`/(feeds)/profile/${evt.person.did}`);
        }}
        emptyText="誰もミュートにしていません"
      />
    );
  }

  return <QueryWithoutData query={mutes} />;
}
