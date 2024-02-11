import { Stack, useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { QueryWithoutData } from "~/components/query-without-data";
import { ProfileTabView } from "~/components/screens/profile/profile-tab-view";
import { useAgent } from "~/lib/agent";

export default function ProfilePage() {
  const { author, tab } = useLocalSearchParams<{
    author: string;
    tab: string;
  }>();

  if (!author) return null;

  if (author.startsWith("did:")) {
    return <ProfileTabView did={author} initial={tab} backButton />;
  } else {
    return (
      <ResolveHandle handle={author}>
        {(did) => <ProfileTabView did={did} initial={tab} backButton />}
      </ResolveHandle>
    );
  }
}

const ResolveHandle = ({
  handle,
  children,
}: {
  handle: string;
  children: (did: string) => React.ReactNode;
}) => {
  const agent = useAgent();

  const resolve = useQuery({
    queryKey: ["resolve", handle],
    queryFn: async () => {
      const { data } = await agent.resolveHandle({ handle });
      return data;
    },
  });

  if (resolve.data) {
    return children(resolve.data.did);
  }

  return (
    <>
      <Stack.Screen options={{ title: "" }} />
      <QueryWithoutData query={resolve} />
    </>
  );
};
