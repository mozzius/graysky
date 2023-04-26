import {
  Ref,
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppBskyFeedDefs } from "@atproto/api";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";

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
    const bottomSheetRef = useRef<BottomSheet>(null);
    const agent = useAuthedAgent();

    const snapPoints = useMemo(() => [100, "60%"], []);

    const handleSheetChanges = useCallback((index: number) => {
      console.log("handleSheetChanges", index);
    }, []);

    useImperativeHandle(ref, () => ({
      open: () => {
        bottomSheetRef.current?.snapToIndex(1);
      },
    }));

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
        snapPoints={snapPoints}
        keyboardBehavior="interactive"
        onChange={handleSheetChanges}
        keyboardBlurBehavior="restore"
        enablePanDownToClose
        style={[bottomSheetStyle]}
      >
        <View className="flex-row px-2 pt-2">
          <View className="px-2">
            <Avatar />
          </View>
          <View className="px-2 pt-2.5">
            <BottomSheetTextInput
              placeholder="What's on your mind?"
              style={[textInputStyle]}
            />
          </View>
        </View>
      </BottomSheet>
    );
  },
);

const { bottomSheetStyle, textInputStyle } = StyleSheet.create({
  bottomSheetStyle: {},
  textInputStyle: {
    fontSize: 20,
  },
});
