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
  AppBskyFeedPost,
  RichText as RichTextHelper,
  type AppBskyFeedDefs,
  type BskyAgent,
} from "@atproto/api";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from "@gorhom/bottom-sheet";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Camera, ImagePlus, Loader2, Send } from "lucide-react-native";

import { useAgent } from "../lib/agent";
import { cx } from "../lib/utils/cx";
import { Avatar } from "./avatar";
import { PostEmbed } from "./embed";
import { RichText } from "./rich-text";

const MAX_LENGTH = 300;

interface ComposerRef {
  open: (reply?: AppBskyFeedDefs.ReplyRef) => void;
  quote: (post: AppBskyFeedDefs.PostView) => void;
  close: () => void;
}

export const ComposerContext = createContext<ComposerRef | null>(null);

export const ComposerProvider = ({ children }: React.PropsWithChildren) => {
  const ref = useRef<ComposerRef>(null);

  const value = useMemo<ComposerRef>(
    () => ({
      open: (reply) => ref.current?.open(reply),
      quote: (post) => ref.current?.quote(post),
      close: () => ref.current?.close(),
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

const generateRichText = async (text: string, agent: BskyAgent) => {
  const rt = new RichTextHelper({ text });
  await rt.detectFacets(agent);
  return rt;
};

export const Composer = forwardRef<ComposerRef>((_, ref) => {
  const { top } = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [text, setText] = useState("");
  const [context, setContext] = useState<
    AppBskyFeedDefs.ReplyRef | AppBskyFeedDefs.PostView
  >();

  // JANK: `AppBskyFeedDefs.isReplyRef` should be able to do this!!!
  const isReply = context && "parent" in context;
  const postView = isReply
    ? (context.parent as AppBskyFeedDefs.PostView)
    : context;

  const [isCollapsed, setIsCollapsed] = useState(true);
  const agent = useAgent();

  // include images when added
  const isEmpty = text.trim().length === 0;

  const send = useMutation({
    mutationKey: ["send"],
    mutationFn: async () => {
      const rt = await generateRichText(text, agent);
      if (rt.graphemeLength > MAX_LENGTH) {
        Alert.alert(
          "Your post is too long",
          "There is a character limit of 300 characters",
        );
        throw new Error("Too long");
      }
      // JANK: see above!
      if (context && !("parent" in context)) {
        const embed = {
          $type: "app.bsky.embed.record",
          record: {
            cid: context.cid,
            uri: context.uri,
          },
        };
        await agent.post({
          text: rt.text,
          facets: rt.facets,
          embed,
        });
      } else {
        await agent.post({
          text: rt.text,
          facets: rt.facets,
          reply: context as AppBskyFeedDefs.ReplyRef | undefined,
        });
      }
    },
    onMutate: () => {
      Keyboard.dismiss();
      setTimeout(() => bottomSheetRef.current?.collapse(), 100);
    },
    onSuccess: () => {
      setText("Sent!");
      setTimeout(() => {
        setText("");
        bottomSheetRef.current?.close();
      }, 1000);
    },
  });

  const rt = useQuery({
    queryKey: ["rt", text],
    queryFn: async () => {
      return await generateRichText(text, agent);
    },
    keepPreviousData: true,
  });

  const tooLong = (rt.data?.graphemeLength ?? 0) > MAX_LENGTH;

  useImperativeHandle(ref, () => ({
    open: (reply) => {
      send.reset();
      // TODO: overwrite warning
      setContext(reply);
      setText("");
      bottomSheetRef.current?.snapToIndex(1);
      // remove delay
      setIsCollapsed(false);
    },
    quote: (post) => {
      send.reset();
      // TODO: overwrite warning
      setContext(post);
      setText("");
      bottomSheetRef.current?.snapToIndex(1);
      // remove delay
      setIsCollapsed(false);
    },
    close: () => {
      bottomSheetRef.current?.close();
    },
  }));

  const handleSheetChanges = (index: number) => {
    setIsCollapsed(index < 1);

    if (index === 0) {
      if (send.isError) {
        bottomSheetRef.current?.expand();
        send.reset();
      } else if (send.isIdle) {
        bottomSheetRef.current?.close();
        setContext(undefined);
        setText("");
      }
    }
  };

  const {
    animatedHandleHeight,
    animatedSnapPoints,
    animatedContentHeight,
    handleContentLayout,
  } = useBottomSheetDynamicSnapPoints([100, "CONTENT_HEIGHT"]);

  const renderBackdrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      style={bottomSheetStyle}
      topInset={top + 25}
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      onClose={() => Keyboard.dismiss()}
    >
      <BottomSheetView
        style={contentContainerStyle}
        onLayout={handleContentLayout}
        key={postView?.cid ?? "none"}
      >
        <View
          className={cx(
            (isCollapsed || send.isLoading || send.isSuccess) &&
              "flex-col-reverse",
          )}
        >
          {postView && AppBskyFeedPost.isRecord(postView.record) && (
            <View
              className={cx("relative px-4 pb-2", isCollapsed && "opacity-0")}
            >
              <View className="absolute bottom-0 left-0 right-0 top-0 z-10" />
              <PostEmbed author={postView.author} uri={postView.uri}>
                {postView.record.text ? (
                  <RichText
                    text={postView.record.text}
                    facets={postView.record.facets}
                    numberOfLines={3}
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
                  !!postView
                    ? `${isReply ? "Replying to" : "Quoting"} ${
                        postView.author.displayName ??
                        `@${postView.author.handle}`
                      }`
                    : "What's on your mind?"
                }
                style={[textInputStyle, send.isLoading && { opacity: 0.5 }]}
                multiline
                value={text}
                onChangeText={(text) => send.isIdle && setText(text)}
                editable={send.isIdle}
                selectTextOnFocus={false}
                textAlignVertical="top"
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
            accessibilityLabel="Add image"
            accessibilityRole="button"
            className="rounded border border-neutral-100 bg-neutral-50 p-1"
            onPress={() => Alert.alert("not yet implemented")}
          >
            <ImagePlus size={24} color="#888888" />
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Use camera"
            accessibilityRole="button"
            className="ml-2 rounded border border-neutral-100 bg-neutral-50 p-1"
            onPress={() => Alert.alert("not yet implemented")}
          >
            <Camera size={24} color="#888888" />
          </TouchableOpacity>
          <View className="flex-1" />
          <Text className={cx("text-sm", tooLong && "text-red-500")}>
            {rt.data?.graphemeLength} / {MAX_LENGTH}
          </Text>
          <TouchableOpacity
            disabled={isEmpty || send.isLoading}
            className="ml-3 flex-row items-center rounded-full bg-neutral-800 px-3 py-2"
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
Composer.displayName = "Composer";

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
  const spin = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(
      withTiming(360, { duration: 500, easing: Easing.linear }),
      -1,
    );
  }, [spin]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${spin.value}deg` }],
    };
  });

  if (!show) return null;

  return (
    <Animated.View
      style={animatedStyle}
      className="absolute flex h-full w-full items-center justify-center bg-black/40"
    >
      <Loader2 size={32} color="white" className="animate-spin" />
    </Animated.View>
  );
};
