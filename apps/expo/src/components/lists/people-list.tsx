import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { TouchableOpacity, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { type AppBskyActorDefs } from "@atproto/api";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
} from "@gorhom/bottom-sheet";
import { Trans } from "@lingui/macro";
import { useTheme } from "@react-navigation/native";
import {
  type InfiniteData,
  type UseInfiniteQueryResult,
} from "@tanstack/react-query";

import { useBottomSheetStyles } from "~/lib/bottom-sheet";
import { cx } from "~/lib/utils/cx";
import { BackButtonOverride } from "../back-button-override";
import { ItemSeparator } from "../item-separator";
import { QueryWithoutData } from "../query-without-data";
import { Text } from "../themed/text";
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
  data: UseInfiniteQueryResult<InfiniteData<PeopleListResponse>, unknown>;
  limit?: number;
}

export const PeopleList = forwardRef<PeopleListRef, Props>(
  ({ title, data, limit }, ref) => {
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const { top } = useSafeAreaInsets();
    const [showAll, setShowAll] = useState(false);
    const theme = useTheme();
    const dimensions = useWindowDimensions();

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

    const reducedMotion = useReducedMotion();

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        enablePanDownToClose
        snapPoints={["60%", dimensions.height - top - 10]}
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
        animateOnMount={!reducedMotion}
      >
        <BackButtonOverride dismiss={onPressBackButton} />
        <Text className="mt-2 text-center text-xl font-medium">{title}</Text>
        {data.data ? (
          <View
            className={cx("mt-4 flex-1", theme.dark ? "bg-black" : "bg-white")}
          >
            <BottomSheetFlatList
              style={contentContainerStyle}
              data={people.slice(0, showAll ? undefined : limit)}
              renderItem={({
                item,
              }: {
                item: AppBskyActorDefs.ProfileView;
              }) => (
                <PersonRow
                  bottomSheet
                  person={item}
                  onPress={() => bottomSheetRef.current?.close()}
                />
              )}
              keyExtractor={(item: AppBskyActorDefs.ProfileView) => item.did}
              ItemSeparatorComponent={() => (
                <ItemSeparator iconWidth="w-10" containerClassName="pr-4" />
              )}
              ListFooterComponent={() => (
                <View className="h-24 w-full items-center justify-center px-4">
                  {limit && !showAll && people.length > limit && (
                    <TouchableOpacity onPress={() => setShowAll(true)}>
                      <Text className="text-center text-neutral-500 dark:text-neutral-400">
                        {data.hasNextPage ? (
                          <Trans>Show all</Trans>
                        ) : (
                          <Trans>Show {people.length - limit} more</Trans>
                        )}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center">
                  <Text className="text-center text-neutral-500 dark:text-neutral-400">
                    <Trans>There&apos;s nothing here...</Trans>
                  </Text>
                </View>
              }
              onEndReachedThreshold={2}
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
