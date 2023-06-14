import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type AppBskyActorDefs } from "@atproto/api";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import { type UseInfiniteQueryResult } from "@tanstack/react-query";

import { useBottomSheetStyles } from "../../lib/bottom-sheet";
import { ItemSeparator } from "../item-separator";
import { QueryWithoutData } from "../query-without-data";
import { PersonRow } from "./person-row";

type PeopleListResponse = {
  people: AppBskyActorDefs.ProfileView[];
  cursor: string | undefined;
};

export interface PeopleListRef {
  open: () => void;
}

interface Props {
  title: string;
  data: UseInfiniteQueryResult<PeopleListResponse, unknown>;

  limit?: number;
}

export const PeopleList = forwardRef<PeopleListRef, Props>(
  ({ title, data, limit }, ref) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const { top } = useSafeAreaInsets();
    const [showAll, setShowAll] = useState(false);
    const theme = useTheme();

    useImperativeHandle(ref, () => ({
      open: () => {
        void data.refetch();
        setShowAll(false);
        bottomSheetRef.current?.snapToIndex(1);
      },
    }));

    const handleSheetChanges = (index: number) => {
      if (index === 0) {
        bottomSheetRef.current?.close();
      }
    };

    const {
      backgroundStyle,
      handleStyle,
      handleIndicatorStyle,
      contentContainerStyle,
    } = useBottomSheetStyles();

    const people = data.data?.pages.flatMap((x) => x.people) ?? [];

    return (
      <BottomSheet
        index={-1}
        ref={bottomSheetRef}
        enablePanDownToClose
        snapPoints={[1, "60%", Dimensions.get("window").height - top - 10]}
        backdropComponent={BottomSheetBackdrop}
        onChange={handleSheetChanges}
        handleIndicatorStyle={handleIndicatorStyle}
        handleStyle={handleStyle}
        backgroundStyle={backgroundStyle}
      >
        <Text
          style={{ color: theme.colors.text }}
          className="mt-2 text-center text-xl font-medium"
        >
          {title}
        </Text>
        {data.data ? (
          <View className="mt-4 flex-1 dark:bg-black">
            <BottomSheetFlatList
              style={contentContainerStyle}
              data={people.slice(0, showAll ? undefined : limit)}
              renderItem={({ item }) => (
                <PersonRow
                  bottomSheet
                  person={item}
                  onPress={() => bottomSheetRef.current?.close()}
                />
              )}
              keyExtractor={(item) => item.did}
              ItemSeparatorComponent={() => (
                <ItemSeparator iconWidth="w-10" containerClassName="pr-4" />
              )}
              ListFooterComponent={() => (
                <View className="h-24 w-full items-center justify-center px-4">
                  {limit && !showAll && people.length > limit && (
                    <TouchableOpacity onPress={() => setShowAll(true)}>
                      <Text className="text-center text-neutral-500 dark:text-neutral-400">
                        {data.hasNextPage
                          ? "Show all"
                          : `Show ${people.length - limit} more`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                  <Text className="text-center text-neutral-500 dark:text-neutral-400">
                    There&apos;s nothing here...
                  </Text>
                </View>
              }
              onEndReachedThreshold={0.6}
              onEndReached={() => {
                if (!limit || showAll || people.length < limit) {
                  void data.fetchNextPage();
                }
              }}
            />
          </View>
        ) : (
          <View className="h-1/2 w-full">
            <QueryWithoutData query={data} />
          </View>
        )}
      </BottomSheet>
    );
  },
);
PeopleList.displayName = "PeopleList";
