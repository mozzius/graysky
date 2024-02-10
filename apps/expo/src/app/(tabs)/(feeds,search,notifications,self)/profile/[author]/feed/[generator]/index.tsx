import { Fragment } from "react";
import { TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { Link, Stack, useLocalSearchParams } from "expo-router";

import { FeedScreen } from "~/components/screens/feed-screen";
import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useFeedInfo } from "~/lib/hooks/feeds";

export default function FeedsPage() {
  const path = useAbsolutePath();
  const { author, generator } = useLocalSearchParams<{
    author: string;
    generator: string;
  }>();

  const feed = `at://${author}/app.bsky.feed.generator/${generator}`;

  const info = useFeedInfo(feed);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Link
              asChild
              href={path(`/profile/${author}/feed/${generator}/details`)}
            >
              <TouchableOpacity>
                <Image
                  source={{ uri: info.data?.view.avatar }}
                  className="h-6 w-6 rounded bg-blue-500"
                  alt={info.data?.view.displayName}
                />
              </TouchableOpacity>
            </Link>
          ),
        }}
      />
      <FeedScreen feed={feed} />
    </>
  );
}
