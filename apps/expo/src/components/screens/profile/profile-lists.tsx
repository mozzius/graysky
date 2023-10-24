import { useMemo } from "react";
import {
  ActivityIndicator,
  LogBox,
  TouchableOpacity,
  View,
} from "react-native";
import { Tabs } from "react-native-collapsible-tab-view";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { AppBskyGraphDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { CheckIcon, ChevronRightIcon } from "lucide-react-native";

import { useTabPressScrollRef } from "~/lib/hooks";
import { cx } from "~/lib/utils/cx";
import { QueryWithoutData } from "../../query-without-data";
import { Text } from "../../text";
import { useProfile, useProfileLists } from "./hooks";

LogBox.ignoreLogs(["FlashList only supports padding related props"]);

interface Props {
  handle: string;
}

export const ProfileLists = ({ handle }: Props) => {
  const lists = useProfileLists(handle);
  const profile = useProfile(handle);

  const listsData = useMemo(() => {
    if (!lists.data) return [];
    return lists.data.pages.flatMap((page) => page.lists);
  }, [lists.data]);

  const [ref, onScroll] = useTabPressScrollRef<(typeof listsData)[number]>();

  if (!profile.data) {
    return <QueryWithoutData query={profile} />;
  }

  if (lists.data) {
    return (
      <Tabs.FlashList<(typeof listsData)[number]>
        ref={ref}
        onScroll={onScroll}
        data={listsData}
        renderItem={({ item }) => (
          <ListItem {...item} dataUpdatedAt={lists.dataUpdatedAt} />
        )}
        onEndReachedThreshold={0.6}
        onEndReached={() => lists.fetchNextPage()}
        estimatedItemSize={91}
        ListFooterComponent={
          lists.isFetching ? (
            <View className="w-full items-center py-8">
              <ActivityIndicator />
            </View>
          ) : (
            <View className="py-16">
              <Text className="text-center">That&apos;s everything!</Text>
            </View>
          )
        }
        extraData={lists.dataUpdatedAt}
      />
    );
  }

  return <QueryWithoutData query={lists} />;
};

const ListItem = ({
  name,
  avatar,
  creator,
  uri,
  description,
  purpose,
  viewer,
}: AppBskyGraphDefs.ListView) => {
  const theme = useTheme();
  const href = `/profile/${creator.did}/lists/${uri.split("/").pop()}`;
  let purposeText = "List";
  let purposeClass = "bg-neutral-500";
  switch (purpose) {
    case AppBskyGraphDefs.MODLIST:
      purposeText = "Moderation list";
      break;
    case AppBskyGraphDefs.CURATELIST:
      purposeText = "Curation list";
      purposeClass = "bg-blue-500";
      break;
  }
  return (
    <Link href={href} asChild>
      <TouchableOpacity>
        <View
          className={cx(
            "flex-row items-center border-b px-4 py-2",
            theme.dark
              ? "border-neutral-700 bg-black"
              : "border-neutral-200 bg-white",
          )}
        >
          <Image
            alt={name}
            source={{ uri: avatar }}
            className={cx("h-10 w-10 rounded", purposeClass)}
          />
          <View className="flex-1 px-3">
            <Text className="text-base font-medium">
              {name}
              {(viewer?.blocked || viewer?.muted) && (
                <>
                  {" "}
                  <CheckIcon color={theme.colors.primary} size={12} />
                </>
              )}
            </Text>
            <Text
              className="text-sm text-neutral-500 dark:text-neutral-400"
              numberOfLines={3}
            >
              {purposeText}
              {description && ` • ${description}`}
            </Text>
          </View>
          <ChevronRightIcon
            size={20}
            className="text-neutral-400 dark:text-neutral-200"
          />
        </View>
      </TouchableOpacity>
    </Link>
  );
};
