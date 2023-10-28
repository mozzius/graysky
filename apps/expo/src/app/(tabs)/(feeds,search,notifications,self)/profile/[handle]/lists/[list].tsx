import { Alert, Platform, Share, TouchableOpacity, View } from "react-native";
import * as Tabs from "react-native-collapsible-tab-view";
import { showToastable } from "react-native-toastable";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { AppBskyGraphDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { MoreHorizontalIcon } from "lucide-react-native";

import { QueryWithoutData } from "~/components/query-without-data";
import { Text } from "~/components/text";
import { useAgent } from "~/lib/agent";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { createTopTabsScreenOptions } from "~/lib/utils/top-tabs";

export default function ListsScreen() {
  const { handle, list: rkey } = useLocalSearchParams<{
    handle: string;
    list: string;
  }>();
  const agent = useAgent();
  const theme = useTheme();
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();

  const list = useInfiniteQuery({
    queryKey: ["profile", handle, "lists", rkey],
    queryFn: async ({ pageParam }) => {
      const uri = `at://${handle}/app.bsky.graph.list/${rkey}`;
      const res = await agent.app.bsky.graph.getList({
        list: uri,
        cursor: pageParam as string | undefined,
      });
      if (!res.success) throw new Error("Could not fetch list");
      return res.data;
    },
  });

  const info = list.data?.pages[0]?.list;

  const deleteList = useMutation({
    mutationFn: async () => {
      if (!handle || !rkey) throw new Error("Missing route params");
      await agent.com.atproto.repo.applyWrites({
        repo: handle,
        writes: [
          {
            $type: "com.atproto.repo.applyWrites#delete",
            collection: "app.bsky.graph.list",
            rkey: rkey,
          },
        ],
      });
    },
    onSuccess: () => {
      router.back();
      showToastable({
        title: "List deleted",
        message: "Your list has been deleted",
      });
    },
    onError: () => {
      showToastable({
        title: "Error",
        message: "Could not delete list",
      });
    },
  });

  if (list.data) {
    if (!info) throw new Error("Could not find list");
    return (
      <>
        <Stack.Screen
          options={{
            title: info.name,
            headerTitle: "",
            headerRight: () => (
              <View className="flex-row">
                <TouchableOpacity
                  className="mr-1 rounded-full bg-neutral-200 p-1.5 dark:bg-neutral-700"
                  onPress={() => {
                    if (info.creator.did === agent.session?.did) {
                      showActionSheetWithOptions(
                        {
                          options: ["Edit", "Delete", "Share", "Cancel"],
                          destructiveButtonIndex: 1,
                          cancelButtonIndex: 3,
                          ...actionSheetStyles(theme),
                        },
                        (buttonIndex) => {
                          const bskyUrl = `https://bsky.app/${handle}/lists/${rkey}`;
                          switch (buttonIndex) {
                            case 0:
                              Alert.alert(
                                "Not yet implemented",
                                "Please use the official app",
                              );
                              break;
                            case 1:
                              Alert.alert(
                                "Delete list",
                                "Are you sure you want to delete this list?",
                                [
                                  {
                                    text: "Cancel",
                                    style: "cancel",
                                  },
                                  {
                                    text: "Delete",
                                    style: "destructive",
                                    onPress: () => {
                                      deleteList.mutate();
                                    },
                                  },
                                ],
                              );
                              break;
                            case 2:
                              void Share.share(
                                Platform.select({
                                  ios: { url: bskyUrl },
                                  default: { message: bskyUrl },
                                }),
                              );
                              break;
                          }
                        },
                      );
                    }
                  }}
                >
                  <MoreHorizontalIcon
                    size={18}
                    className="text-neutral-600 dark:text-neutral-300"
                  />
                </TouchableOpacity>
              </View>
            ),
          }}
        />
        {info.purpose === AppBskyGraphDefs.CURATELIST ? (
          <Tabs.Container
            headerContainerStyle={{ shadowOpacity: 0, elevation: 0 }}
            renderTabBar={(props) => (
              <Tabs.MaterialTabBar
                {...props}
                {...createTopTabsScreenOptions(theme)}
              />
            )}
            lazy
          >
            <Tabs.Tab name="feed">
              <Text>Feed</Text>
            </Tabs.Tab>
            <Tabs.Tab name="members">
              <Text>Members</Text>
            </Tabs.Tab>
          </Tabs.Container>
        ) : (
          <Tabs.Container
            headerContainerStyle={{ shadowOpacity: 0, elevation: 0 }}
            renderTabBar={(props) => (
              <Tabs.MaterialTabBar
                {...props}
                {...createTopTabsScreenOptions(theme)}
              />
            )}
            lazy
          >
            <Tabs.Tab name="members">
              <Text>Members</Text>
            </Tabs.Tab>
          </Tabs.Container>
        )}
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: "List",
          headerTitle: "",
        }}
      />
      <QueryWithoutData query={list} />
    </>
  );
}
