import { useMemo } from "react";
import { LogBox, RefreshControl, TouchableHighlight, View } from "react-native";
import { Tabs } from "react-native-collapsible-tab-view";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { AppBskyGraphDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { CheckIcon, ChevronRightIcon } from "lucide-react-native";

import { ListFooterComponent } from "~/components/list-footer";
import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useTabPressScrollRef } from "~/lib/hooks";
import { cx } from "~/lib/utils/cx";
import { useUserRefresh } from "~/lib/utils/query";
import { Text } from "../../themed/text";
import { useProfileLists } from "./hooks";
import { INITIAL_HEADER_HEIGHT } from "./profile-info";

LogBox.ignoreLogs(["FlashList only supports padding related props"]);

interface Props {
  did: string;
}

export const ProfileLists = ({ did }: Props) => {
  const lists = useProfileLists(did);

  const listsData = useMemo(() => {
    if (!lists.data) return [];
    return lists.data.pages.flatMap((page) => page.lists);
  }, [lists.data]);

  const [ref, onScroll] = useTabPressScrollRef<(typeof listsData)[number]>();

  const { refreshing, handleRefresh, tintColor } = useUserRefresh(
    lists.refetch,
  );

  return (
    <Tabs.FlashList<(typeof listsData)[number]>
      removeClippedSubviews
      ref={ref}
      onScroll={onScroll}
      data={listsData}
      renderItem={({ item }) => (
        <ListItem {...item} dataUpdatedAt={lists.dataUpdatedAt} />
      )}
      onEndReachedThreshold={2}
      onEndReached={() => lists.fetchNextPage()}
      ListFooterComponent={<ListFooterComponent query={lists} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={tintColor}
          progressViewOffset={INITIAL_HEADER_HEIGHT}
        />
      }
    />
  );
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
  const path = useAbsolutePath();
  const href = path(`/profile/${creator.did}/lists/${uri.split("/").pop()}`);
  let purposeText = "List";
  let purposeClass = "bg-neutral-500";
  switch (purpose) {
    case AppBskyGraphDefs.MODLIST:
      purposeText = "Moderation list";
      break;
    case AppBskyGraphDefs.CURATELIST:
      purposeText = "User list";
      purposeClass = "bg-blue-500";
      break;
  }
  return (
    <Link href={href} asChild>
      <TouchableHighlight>
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
                  <CheckIcon color={theme.colors.primary} size={16} />
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
      </TouchableHighlight>
    </Link>
  );
};
