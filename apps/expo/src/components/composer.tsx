import {
  Ref,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppBskyFeedDefs } from "@atproto/api";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from "@gorhom/bottom-sheet";
import { useHeaderHeight } from "@react-navigation/elements";

import { useAuthedAgent } from "../lib/agent";
import { Avatar } from "./avatar";

interface Props {
  replyingTo?: AppBskyFeedDefs.PostView;
}

interface ComposerRef {
  open: () => void;
}

export const useComposer = () => {
  return useRef<ComposerRef>(null);
};

export const Composer = forwardRef<ComposerRef, Props>(
  ({ replyingTo }, ref) => {
    const headerHeight = useHeaderHeight();
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [text, setText] = useState("");
    const agent = useAuthedAgent();

    const handleSheetChanges = useCallback((index: number) => {
      console.log("handleSheetChanges", index);
    }, []);

    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.snapToIndex(1);
      },
    }));

    const initialSnapPoints = useMemo(() => [100, "CONTENT_HEIGHT"], []);

    const {
      animatedHandleHeight,
      animatedSnapPoints,
      animatedContentHeight,
      handleContentLayout,
    } = useBottomSheetDynamicSnapPoints(initialSnapPoints);

    const renderBackdrop = useCallback(
      (props: any) => (
        <BottomSheetBackdrop {...props} pressBehavior="collapse" />
      ),
      [],
    );

    return (
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        backdropComponent={renderBackdrop}
        keyboardBehavior="interactive"
        onChange={handleSheetChanges}
        keyboardBlurBehavior="restore"
        enablePanDownToClose={text.length === 0}
        style={[bottomSheetStyle]}
        topInset={headerHeight + 10}
        snapPoints={animatedSnapPoints}
        handleHeight={animatedHandleHeight}
        contentHeight={animatedContentHeight}
      >
        <BottomSheetView
          style={[contentContainerStyle]}
          onLayout={handleContentLayout}
        >
          <View className="flex-row px-2 pb-8 pt-2">
            <View className="shrink-0 px-2">
              <Avatar />
            </View>
            <View className="flex-1 px-2 pt-2.5">
              <BottomSheetTextInput
                placeholder="What's on your mind?"
                style={[textInputStyle]}
                multiline
                value={text}
                onChangeText={setText}
              />
            </View>
          </View>
        </BottomSheetView>
      </BottomSheet>
    );
  },
);

const { bottomSheetStyle, contentContainerStyle, textInputStyle } =
  StyleSheet.create({
    bottomSheetStyle: {},
    contentContainerStyle: {},
    textInputStyle: {
      fontSize: 20,
      minHeight: 150,
    },
  });
