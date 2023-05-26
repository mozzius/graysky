import { Text, View } from "react-native";
import DraggableFlatList from "react-native-draggable-flatlist";
import { AppBskyActorDefs } from "@atproto/api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { produce } from "immer";

import { GeneratorRow } from "../components/generator-row";
import { QueryWithoutData } from "../components/query-without-data";
import { useAuthedAgent } from "../lib/agent";
import { useSavedFeeds } from "../lib/hooks";

export default function AlgorithmsModal() {
  const agent = useAuthedAgent();
  const savedFeeds = useSavedFeeds();
  const queryClient = useQueryClient();

  const togglePinned = useMutation({
    mutationFn: async (feed: string) => {
      if (!savedFeeds.data) return;

      await agent.app.bsky.actor.putPreferences({
        preferences: produce(savedFeeds.data.preferences, (draft) => {
          for (const pref of draft) {
            if (
              AppBskyActorDefs.isSavedFeedsPref(pref) &&
              AppBskyActorDefs.validateSavedFeedsPref(pref).success
            ) {
              if (pref.pinned.includes(feed)) {
                pref.pinned = pref.pinned.filter((f) => f !== feed);
              } else {
                pref.pinned.push(feed);
              }
            }
          }
        }),
      });
    },
    onSettled: () => queryClient.invalidateQueries(["feeds", "saved"]),
  });

  const reorder = useMutation({
    mutationFn: async (saved: string[]) => {
      if (!savedFeeds.data) return;

      await agent.app.bsky.actor.putPreferences({
        preferences: produce(savedFeeds.data.preferences, (draft) => {
          for (const pref of draft) {
            if (
              AppBskyActorDefs.isSavedFeedsPref(pref) &&
              AppBskyActorDefs.validateSavedFeedsPref(pref).success
            ) {
              pref.saved = saved;
            }
          }
        }),
      });
    },
    onSettled: () => queryClient.invalidateQueries(["feeds", "saved"]),
  });

  if (savedFeeds.data) {
    return (
      <View className="flex-1 border-neutral-700 dark:border-t">
        <DraggableFlatList
          keyExtractor={(item) => item.uri}
          data={savedFeeds.data.feeds}
          onDragEnd={({ data }) => {
            queryClient.setQueryData(
              ["feeds", "saved", { pinned: false }],
              (old) => ({
                ...(old as typeof savedFeeds.data),
                feeds: data,
              }),
            );
            reorder.mutate(data.map((d) => d.uri));
          }}
          renderItem={({ item, drag, isActive }) => {
            return (
              <GeneratorRow
                drag={drag}
                isDragging={isActive}
                image={item.avatar}
                icon="pin"
                pinned={item.pinned}
                togglePinned={() => {
                  queryClient.setQueryData(
                    ["feeds", "saved", { pinned: false }],
                    (old) =>
                      produce(old as typeof savedFeeds.data, (draft) => {
                        for (const feed of draft.feeds) {
                          if (feed.uri === item.uri) {
                            feed.pinned = !feed.pinned;
                          }
                        }
                      }),
                  );
                  togglePinned.mutate(item.uri);
                }}
              >
                <Text className="text-base dark:text-neutral-50">
                  {item.displayName}
                </Text>
                <Text className="text-neutral-400">
                  By @{item.creator.handle}
                </Text>
              </GeneratorRow>
            );
          }}
          ListFooterComponent={() => (
            <Text className="p-4 text-center text-neutral-400">
              Pin your saved feeds here to see them in the Skyline tab. You can
              save additional feeds in the Feeds tab.
            </Text>
          )}
        />
      </View>
    );
  }

  return <QueryWithoutData query={savedFeeds} />;
}
