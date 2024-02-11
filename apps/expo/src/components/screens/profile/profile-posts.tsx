import { LogBox } from "react-native";
import { Tabs } from "react-native-collapsible-tab-view";
import { RefreshControl } from "react-native-gesture-handler";

import { ListFooterComponent } from "~/components/list-footer";
import { useTabPressScrollRef } from "~/lib/hooks";
import { useUserRefresh } from "~/lib/utils/query";
import { FeedPost } from "../../feed-post";
import { useProfile, useProfilePosts } from "./hooks";

LogBox.ignoreLogs(["FlashList only supports padding related props"]);

// vendored react-merge-refs due to import issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mergeRefs<T = any>(
  refs: (React.MutableRefObject<T> | React.LegacyRef<T>)[],
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

interface Props {
  did: string;
  mode: "posts" | "replies" | "likes" | "media";
}

export const ProfilePosts = ({ did, mode }: Props) => {
  const { preferences, timeline, timelineData } = useProfilePosts(mode, did);

  const profile = useProfile(did);

  const [ref, onScroll] = useTabPressScrollRef<(typeof timelineData)[number]>(
    timeline.refetch,
  );

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    timeline.refetch,
  );

  if (profile.data?.viewer?.blocking) {
    return null;
  } else if (profile.data?.viewer?.blockedBy) {
    return null;
  } else {
    return (
      <Tabs.FlashList<(typeof timelineData)[number]>
        ref={ref}
        onScroll={onScroll}
        data={preferences.data ? timelineData : []}
        renderItem={({ item, index }) => (
          <FeedPost
            {...item}
            // TODO: investigate & fix error with isReply logic below
            isReply={mode === "replies" && timelineData[index - 1]?.hasReply}
            inlineParent={mode !== "replies"}
            dataUpdatedAt={timeline.dataUpdatedAt}
          />
        )}
        onEndReachedThreshold={2}
        onEndReached={() => timeline.fetchNextPage()}
        estimatedItemSize={100}
        ListFooterComponent={<ListFooterComponent query={timeline} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={tintColor}
          />
        }
      />
    );
  }
};
