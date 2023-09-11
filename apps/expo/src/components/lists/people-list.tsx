import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { BackHandler, Dimensions, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type AppBskyActorDefs } from "@atproto/api";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import { type UseInfiniteQueryResult } from "@tanstack/react-query";

import { useBottomSheetStyles } from "~/lib/bottom-sheet";
import { cx } from "~/lib/utils/cx";
import { ItemSeparator } from "../item-separator";
import { QueryWithoutData } from "../query-without-data";
import { Text } from "../text";
import { PersonRow } from "./person-row";

interface PeopleListResponse {
  people: AppBskyActorDefs.ProfileView[];
  cursor: string | undefined;
}

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
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { top } = useSafeAreaInsets();
    const [showAll, setShowAll] = useState(false);
    const theme = useTheme();

    useImperativeHandle(ref, () => ({
      open: () => {
        void data.refetch();
        setShowAll(false);
        bottomSheetRef.current?.present();
      },
    }));

    const onPressBackButton = useCallback(
      () => bottomSheetRef.current?.dismiss(),
      [],
    );

    const {
      backgroundStyle,
      handleStyle,
      handleIndicatorStyle,
      contentContainerStyle,
    } = useBottomSheetStyles();

    const people = data.data?.pages.flatMap((x) => x.people) ?? [];

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        enablePanDownToClose
        snapPoints={["60%", Dimensions.get("window").height - top - 10]}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            appearsOnIndex={0}
            disappearsOnIndex={-1}
          />
        )}
        handleIndicatorStyle={handleIndicatorStyle}
        handleStyle={handleStyle}
        backgroundStyle={backgroundStyle}
        enableDismissOnClose
        detached
      >
        <BackButton dismiss={onPressBackButton} />
        <Text className="mt-2 text-center text-xl font-medium">{title}</Text>
        {data.data ? (
          <View
            className={cx("mt-4 flex-1", theme.dark ? "bg-black" : "bg-white")}
          >
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
      </BottomSheetModal>
    );
  },
);
PeopleList.displayName = "PeopleList";

const BackButton = ({ dismiss }: { dismiss: () => void }) => {
  useEffect(() => {
    function onBackButton() {
      dismiss();
      return true;
    }
    BackHandler.addEventListener("hardwareBackPress", onBackButton);
    return () => {
      BackHandler.removeEventListener("hardwareBackPress", onBackButton);
    };
  }, [dismiss]);

  return null;
};
