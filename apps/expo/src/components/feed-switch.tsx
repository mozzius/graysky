import { useCallback, useRef } from "react";
import { Dimensions } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetSectionList,
} from "@gorhom/bottom-sheet";

import { NoFeeds } from "~/app/(tabs)/(feeds,search,notifications,self)/feeds";
import { useBottomSheetStyles } from "~/lib/bottom-sheet";
import { useReorderFeeds, useSavedFeeds } from "~/lib/hooks/feeds";
import { useAppPreferences } from "~/lib/hooks/preferences";
import { BackButtonOverride } from "./back-button-override";
import { QueryWithoutData } from "./query-without-data";

export const FeedSwitch = () => {
  const bottomSheetRef = useRef<BottomSheetModal>(null);
  const { top } = useSafeAreaInsets();

  const onPressBackButton = useCallback(
    () => bottomSheetRef.current?.dismiss(),
    [],
  );

  const {
    backgroundStyle,
    handleStyle,
    handleIndicatorStyle,
    // contentContainerStyle,
  } = useBottomSheetStyles();

  return (
    <>
      <TouchableOpacity
        onPress={() => bottomSheetRef.current?.present()}
      ></TouchableOpacity>
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
      >
        <BackButtonOverride dismiss={onPressBackButton} />
        <SheetContent />
      </BottomSheetModal>
    </>
  );
};

const SheetContent = () => {
  const savedFeeds = useSavedFeeds();
  const [{ sortableFeeds }] = useAppPreferences();

  const { pinned, saved } = useReorderFeeds(savedFeeds);

  if (savedFeeds.data) {
    if (savedFeeds.data.feeds.length === 0) {
      return <NoFeeds />;
    }

    const favs = pinned
      .map((uri) => savedFeeds.data.feeds.find((f) => f.uri === uri)!)
      .filter(Boolean);
  }

  return <QueryWithoutData query={savedFeeds} />;
};
