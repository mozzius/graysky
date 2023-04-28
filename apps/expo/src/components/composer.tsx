import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AppBskyFeedDefs,
  AppBskyFeedPost,
  RichText as RichTextHelper,
} from "@atproto/api";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from "@gorhom/bottom-sheet";
import { useMutation } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, Send } from "lucide-react-native";

import { useAgent } from "../lib/agent";
import { cx } from "../lib/utils/cx";
import { Avatar } from "./avatar";
import { PostEmbed } from "./embed";
import { RichText } from "./rich-text";

interface ComposerRef {
  open: (reply?: AppBskyFeedDefs.ReplyRef) => void;
  close: () => void;
}

export const ComposerContext = createContext<ComposerRef | null>(null);

export const ComposerProvider = ({ children }: React.PropsWithChildren) => {
  const ref = useRef<ComposerRef>(null);

  const value = useMemo(
    () => ({
      open: (reply?: AppBskyFeedDefs.ReplyRef) => {
        ref.current?.open(reply);
      },
      close: () => {
        ref.current?.close();
      },
    }),
    [],
  );

  return (
    <ComposerContext.Provider value={value}>
      {children}
      <Composer ref={ref} />
    </ComposerContext.Provider>
  );
};

export const useComposer = () => {
  const ctx = useContext(ComposerContext);
  if (!ctx) {
    throw new Error("useComposer must be used within a ComposerProvider");
  }
  return ctx;
};

export const Composer = forwardRef<ComposerRef>((_, ref) => {
  const { top } = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [text, setText] = useState("");
  const [replyingTo, setReplyingTo] = useState<AppBskyFeedDefs.ReplyRef>();

  const [isCollapsed, setIsCollapsed] = useState(true);
  const agent = useAgent();

  // include images when added
  const isEmpty = text.trim().length === 0;

  const send = useMutation({
    mutationKey: ["send"],
    mutationFn: async () => {
      const rt = new RichTextHelper({ text });
      await rt.detectFacets(agent);
      await agent.post({
        text: rt.text,
        facets: rt.facets,
        reply: replyingTo,
      });
    },
    onMutate: () => {
      Keyboard.dismiss();
      setTimeout(() => bottomSheetRef.current?.collapse(), 100);
    },
    onSuccess: () => {
      bottomSheetRef.current?.close();
      setText("");
    },
  });

  useImperativeHandle(ref, () => ({
    open: (reply?: AppBskyFeedDefs.ReplyRef) => {
      // TODO: overwrite warning
      setReplyingTo(reply);
      setText("");
      bottomSheetRef.current?.snapToIndex(1);
      // remove delay
      setIsCollapsed(false);
    },
    close: () => {
      bottomSheetRef.current?.close();
      setReplyingTo(undefined);
      setText("");
    },
  }));

  useEffect(() => {});

  const handleSheetChanges = useCallback((index: number) => {
    setIsCollapsed(index < 1);
    if (index === 0 && !send.isLoading) {
      bottomSheetRef.current?.close();
      setReplyingTo(undefined);
      setText("");
    }
  }, []);

  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints([100, "CONTENT_HEIGHT"]);

  const renderBackdrop = useCallback(
    (props: any) => <BottomSheetBackdrop {...props} pressBehavior="close" />,
    [],
  );

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onChange={handleSheetChanges}
      enablePanDownToClose={text.length === 0 && !send.isLoading}
      style={[bottomSheetStyle]}
      topInset={top + 50}
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
    >
      <BottomSheetView
        style={[contentContainerStyle]}
        onLayout={handleContentLayout}
        key={replyingTo?.parent?.cid ?? "none"}
      >
        <View className={cx(isCollapsed && "flex-col-reverse")}>
          {replyingTo && AppBskyFeedPost.isRecord(replyingTo.parent.record) && (
            <View
              className={cx("relative px-4 pb-2", isCollapsed && "opacity-0")}
            >
              <View className="absolute bottom-0 left-0 right-0 top-0 z-10" />
              <PostEmbed
                author={replyingTo.parent.author}
                uri={replyingTo.parent.uri}
              >
                {replyingTo.parent.record.text ? (
                  <RichText
                    text={replyingTo.parent.record.text}
                    facets={replyingTo.parent.record.facets}
                  />
                ) : (
                  <Text>📷</Text>
                )}
              </PostEmbed>
            </View>
          )}
          <View className="flex-row px-2 pb-8 pt-2">
            <View className="shrink-0 px-2">
              <View className="relative overflow-hidden rounded-full">
                <Avatar />
                <Spinner show={send.isLoading} />
              </View>
            </View>
            <View className="relative flex-1 px-2 pt-1">
              <BottomSheetTextInput
                placeholder={
                  send.isLoading ? "Sending..." : "What's on your mind?"
                }
                style={[textInputStyle, send.isLoading && { opacity: 0.5 }]}
                multiline
                value={text}
                onChangeText={setText}
                editable={!send.isLoading}
                selectTextOnFocus={false}
              />
            </View>
          </View>
        </View>
        <View
          className={cx(
            "flex-row items-center border-t border-neutral-100 px-3 py-2",
            send.isLoading && "opacity-0",
          )}
        >
          <TouchableOpacity
            className="rounded border border-neutral-100 bg-neutral-50 p-1"
            onPress={() => Alert.alert("not yet implemented")}
          >
            <ImagePlus size={24} color="#888888" />
          </TouchableOpacity>
          <TouchableOpacity
            className="ml-2 rounded border border-neutral-100 bg-neutral-50 p-1"
            onPress={() => Alert.alert("not yet implemented")}
          >
            <Camera size={24} color="#888888" />
          </TouchableOpacity>
          <View className="flex-1" />
          <TouchableOpacity
            disabled={isEmpty || send.isLoading}
            className="ml-2 flex-row items-center rounded-full bg-neutral-800 px-3 py-2"
            onPress={() => send.mutate()}
          >
            <Text className="mr-2 text-white">Post</Text>
            <Send size={12} color="white" />
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});

const { bottomSheetStyle, contentContainerStyle, textInputStyle } =
  StyleSheet.create({
    bottomSheetStyle: {},
    contentContainerStyle: {},
    textInputStyle: {
      padding: 0,
      fontSize: 20,
      lineHeight: 28,
      height: 150,
    },
  });

const Spinner = ({ show }: { show: boolean }) => {
  if (!show) return null;
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 500, easing: Easing.linear }),
      -1,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spin.value}deg` }],
    };
  });

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute flex h-full w-full items-center justify-center bg-black/40"
    >
      <Loader2 size={32} color="white" className="animate-spin" />
    </Animated.View>
  );
};
