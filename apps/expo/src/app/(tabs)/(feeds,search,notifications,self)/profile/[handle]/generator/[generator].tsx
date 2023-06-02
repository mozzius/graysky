import { useLocalSearchParams } from "expo-router";

import { FeedScreen } from "../../../../../../components/screens/feed-screen";

export default function FeedPage() {
  const { handle, generator } = useLocalSearchParams() as {
    handle: string;
    generator: string;
  };

  const feed = `at://${handle}/app.bsky.feed.generator/${generator}`;

  return <FeedScreen feed={feed} />;
}
