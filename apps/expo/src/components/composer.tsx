import {
  createContext,
  forwardRef,
  memo,
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
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
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
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import {
  AppBskyFeedPost,
  RichText as RichTextHelper,
  type AppBskyEmbedImages,
  type AppBskyEmbedRecord,
  type AppBskyEmbedRecordWithMedia,
  type AppBskyFeedDefs,
  type BskyAgent,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import BottomSheet, {
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
  useBottomSheetDynamicSnapPoints,
} from "@gorhom/bottom-sheet";
import { useTheme } from "@react-navigation/native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ImagePlus,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react-native";

import { useAgent } from "../lib/agent";
import { useBottomSheetStyles } from "../lib/bottom-sheet";
import { useColorScheme } from "../lib/utils/color-scheme";
import { cx } from "../lib/utils/cx";
import { Avatar } from "./avatar";
import { PostEmbed } from "./embed";
import { RichText } from "./rich-text";

// text
const MAX_LENGTH = 300;

// images
const MAX_IMAGES = 4;
const MAX_SIZE = 1_000_000;
const MAX_DIMENSION = 2048;

interface ComposerRef {
  open: (reply?: AppBskyFeedPost.ReplyRef) => void;
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
      <MemoizedComposer ref={ref} />
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
  const [images, setImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [showImages, setShowImages] = useState(false);
  const queryClient = useQueryClient();
  const [context, setContext] = useState<
    AppBskyFeedPost.ReplyRef | AppBskyFeedDefs.PostView
  >();

  // JANK: `AppBskyFeedDefs.isReplyRef` should be able to do this!!!
  const isReply = context && "parent" in context;
  const postView = isReply
    ? (context.parent as AppBskyFeedDefs.PostView)
    : context;

  const [isCollapsed, setIsCollapsed] = useState(true);
  const agent = useAgent();

  const isEmpty = text.trim().length === 0 && images.length === 0;

  const send = useMutation({
    mutationKey: ["send"],
    mutationFn: async () => {
      if (!agent.hasSession) throw new Error("Not logged in");
      const rt = await generateRichText(text, agent);
      if (rt.graphemeLength > MAX_LENGTH) {
        Alert.alert(
          "Your post is too long",
          "There is a character limit of 300 characters",
        );
        throw new Error("Too long");
      }
      const uploadedImages = await Promise.all(
        images.map(async (img) => {
          let uri = img.uri;
          const size = img.fileSize ?? MAX_SIZE + 1;
          let targetWidth,
            targetHeight = MAX_DIMENSION;

          const needsResize =
            img.width > MAX_DIMENSION || img.height > MAX_DIMENSION;

          if (img.width > img.height) {
            targetHeight = img.height * (MAX_DIMENSION / img.width);
          } else {
            targetWidth = img.width * (MAX_DIMENSION / img.height);
          }

          // compress if > 1mb

          if (size > MAX_SIZE) {
            // let animation complete
            await new Promise((resolve) => setTimeout(resolve, 500));
            // compress iteratively, reducing quality each time
            for (let i = 0; i < 9; i++) {
              const quality = 100 - i * 10;

              try {
                const compressed = await ImageManipulator.manipulateAsync(
                  img.uri,
                  needsResize
                    ? [{ resize: { width: targetWidth, height: targetHeight } }]
                    : [],
                  {
                    compress: quality / 100,
                  },
                ).then((x) => x.uri);
                const compressedSize = await FileSystem.getInfoAsync(
                  compressed,
                  {
                    size: true,
                  }, // @ts-expect-error size is not in the type
                ).then((x) => x.size as number);

                if (compressedSize < MAX_SIZE) {
                  uri = compressed;
                  break;
                }
              } catch (err) {
                throw new Error(`Failed to resize: ${err}`);
              }
            }
          }

          const uploaded = await agent.uploadBlob(uri);
          if (!uploaded.success) throw new Error("Failed to upload image");
          return uploaded.data.blob;
        }),
      );
      let reply: AppBskyFeedPost.ReplyRef | undefined;
      let embed: AppBskyFeedPost.Record["embed"] | undefined;
      // JANK: see above!
      if (context && !("parent" in context)) {
        if (images.length > 0) {
          // reply, images
          embed = {
            $type: "app.bsky.embed.recordWithMedia",
            record: {
              $type: "app.bsky.embed.record",
              record: {
                cid: context.cid,
                uri: context.uri,
              },
            },
            media: {
              $type: "app.bsky.embed.images",
              images: uploadedImages.map((img) => ({
                // IMPORTANT TODO: alt text
                alt: "",
                image: img,
              })),
            } satisfies AppBskyEmbedImages.Main,
          } satisfies AppBskyEmbedRecordWithMedia.Main;
        } else {
          // reply, no images
          embed = {
            $type: "app.bsky.embed.record",
            record: {
              cid: context.cid,
              uri: context.uri,
            },
          } satisfies AppBskyEmbedRecord.Main;
        }
      } else {
        reply = context as AppBskyFeedPost.ReplyRef | undefined;
        if (images.length > 0) {
          // images, no record
          embed = {
            $type: "app.bsky.embed.images",
            images: uploadedImages.map((img) => ({
              // IMPORTANT TODO: alt text
              alt: "",
              image: img,
            })),
          } satisfies AppBskyEmbedImages.Main;
        }
      }
      await agent.post({
        text: rt.text,
        facets: rt.facets,
        reply,
        embed,
      });
      if (isReply && postView) {
        void queryClient.invalidateQueries([
          "profile",
          postView.author.handle,
          "post",
        ]);
      }
    },
    onMutate: () => {
      void Haptics.impactAsync();
      Keyboard.dismiss();
      setShowImages(false);
      setTimeout(() => bottomSheetRef.current?.collapse(), 100);
    },
    onError: (error) => {
      setTimeout(() => {
        bottomSheetRef.current?.expand();
        setIsCollapsed(false);
      }, 150);
      Alert.alert(
        "Failed to send post",
        `Please try again${error instanceof Error ? `\n${error.message}` : ""}`,
      );
      send.reset();
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
      setImages([]);
      bottomSheetRef.current?.snapToIndex(1);
      // remove delay
      setIsCollapsed(false);
    },
    quote: (post) => {
      send.reset();
      // TODO: overwrite warning
      setContext(post);
      setText("");
      setImages([]);
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
  } = useBottomSheetDynamicSnapPoints([105, "CONTENT_HEIGHT"]);

  const { colorScheme } = useColorScheme();

  const { showActionSheetWithOptions } = useActionSheet();

  const {
    backgroundStyle,
    contentContainerStyle,
    textInputStyle,
    handleStyle,
    handleIndicatorStyle,
  } = useBottomSheetStyles();

  const handleAddImage = async () => {
    if (images.length >= MAX_IMAGES) return;

    // hackfix - android crashes if keyboard is open
    if (Platform.OS === "android") {
      Keyboard.dismiss();
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    const options = ["Take Photo", "Choose from Library", "Cancel"];
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: options.length - 1,
      },
      async (index) => {
        if (index === undefined) return;
        const selected = options[index];
        switch (selected) {
          case "Take Photo":
            if (!(await getCameraPermission())) {
              return;
            }
            void ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
              selectionLimit: MAX_IMAGES - images.length,
              exif: false,
              quality: 0.7,
            }).then((result) => {
              if (!result.canceled) {
                setImages((prev) => [...prev, ...result.assets]);
                setShowImages(true);
              }
            });
            break;
          case "Choose from Library":
            if (!(await getGalleryPermission())) {
              return;
            }
            void ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsMultipleSelection: true,
              selectionLimit: MAX_IMAGES - images.length,
              exif: false,
              quality: 0.7,
            }).then((result) => {
              if (!result.canceled) {
                setImages((prev) => [...prev, ...result.assets]);
                setShowImages(true);
              }
            });
        }
      },
    );
  };

  const renderBackdrop = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => <BottomSheetBackdrop {...props} pressBehavior="close" />,
    [],
  );

  const theme = useTheme();

  return (
    <BottomSheet
      ref={bottomSheetRef}
      index={-1}
      backgroundStyle={backgroundStyle}
      backdropComponent={renderBackdrop}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      onChange={handleSheetChanges}
      enablePanDownToClose={
        text.length === 0 && images.length === 0 && !send.isLoading
      }
      topInset={top + 25}
      snapPoints={animatedSnapPoints}
      handleHeight={animatedHandleHeight}
      contentHeight={animatedContentHeight}
      onClose={() => Keyboard.dismiss()}
      handleStyle={handleStyle}
      handleIndicatorStyle={handleIndicatorStyle}
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
                    numberOfLines={2}
                  />
                ) : (
                  <Text>📷</Text>
                )}
              </PostEmbed>
            </View>
          )}
          <View className="relative">
            {showImages && images.length > 0 && (
              <View
                style={{ backgroundColor: theme.colors.card }}
                className={cx(
                  "absolute z-10 h-full w-full flex-wrap border-neutral-100 pt-2 dark:border-neutral-600",
                  postView &&
                    AppBskyFeedPost.isRecord(postView.record) &&
                    "border-t",
                )}
              >
                <TouchableOpacity
                  onPress={() => setShowImages(false)}
                  className="mb-2 w-full flex-row items-center justify-between px-4"
                >
                  <Text className="text-base font-semibold dark:text-white">
                    Attached images
                  </Text>
                  <ChevronDown color="#888888" />
                </TouchableOpacity>
                <ScrollView
                  horizontal
                  className="h-full w-full"
                  contentContainerStyle={{ paddingHorizontal: 16 }}
                >
                  {images.map((image, i) => (
                    <View
                      key={image.uri}
                      className={cx("relative", i !== 3 && "mr-2")}
                    >
                      <Image
                        cachePolicy="memory"
                        source={{ uri: image.uri }}
                        alt={`image ${i}}`}
                        className="h-36 w-36 rounded"
                      />
                      <TouchableWithoutFeedback
                        onPress={() => {
                          setImages((prev) => {
                            const next = prev.filter((_, index) => index !== i);
                            setShowImages(next.length > 0);
                            return next;
                          });
                        }}
                      >
                        <View className="absolute right-2 top-2 z-10 rounded-full bg-black/90 p-1">
                          <X size={12} color="white" />
                        </View>
                      </TouchableWithoutFeedback>
                    </View>
                  ))}
                  {images.length < MAX_IMAGES && (
                    <TouchableOpacity onPress={() => void handleAddImage()}>
                      <View className="h-36 w-36 items-center justify-center rounded border border-neutral-200 dark:border-neutral-500">
                        <Plus
                          color={colorScheme === "light" ? "black" : "white"}
                        />
                        <Text className="mt-2 text-center dark:text-white">
                          Add image
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            )}
            <View className="flex-row px-2 pb-8 pt-2">
              <View className="shrink-0 px-2">
                <View
                  className="relative overflow-hidden rounded-full"
                  accessibilityElementsHidden={true}
                  importantForAccessibility="no-hide-descendants"
                >
                  <Avatar />
                  <Spinner show={send.isLoading} />
                </View>
              </View>
              <View className="relative flex-1 px-2 pt-1">
                <BottomSheetTextInput
                  placeholder={
                    send.isLoading
                      ? "Sending..."
                      : postView
                      ? `${isReply ? "Replying to" : "Quoting"} ${
                          postView.author.displayName ??
                          `@${postView.author.handle}`
                        }`
                      : "What's on your mind?"
                  }
                  style={[textInputStyle, send.isLoading && { opacity: 0.5 }]}
                  multiline
                  onChangeText={(text) => send.isIdle && setText(text)}
                  editable={send.isIdle}
                  selectTextOnFocus={false}
                  textAlignVertical="top"
                  placeholderTextColor={
                    colorScheme === "light" ? "#aaa" : "#555"
                  }
                >
                  <RichText
                    size="xl"
                    text={rt.data?.text ?? text}
                    facets={rt.data?.facets}
                    truncate={false}
                    disableLinks
                  />
                </BottomSheetTextInput>
              </View>
            </View>
          </View>
        </View>
        <View
          className={cx(
            "flex-row items-center border-t border-neutral-100 px-3 py-2 dark:border-y dark:border-neutral-800",
            send.isLoading && "opacity-0",
          )}
        >
          <TouchableOpacity
            accessibilityLabel="Add image"
            accessibilityRole="button"
            className="flex-row items-center rounded border border-neutral-100 bg-neutral-50 p-1 dark:border-neutral-600 dark:bg-neutral-800"
            onPress={() => {
              if (images.length === 0) void handleAddImage();
              else setShowImages((s) => !s);
            }}
          >
            <ImagePlus size={24} color="#888888" />
            <Text className="ml-2 text-base font-medium text-neutral-500 dark:text-neutral-400">
              {images.length > 0
                ? `${images.length} image${
                    images.length !== 1 ? "s" : ""
                  } attached`
                : "Add image"}
            </Text>
          </TouchableOpacity>
          <View className="flex-1" />
          <Text
            className={cx("text-sm dark:text-white", tooLong && "text-red-500")}
          >
            {rt.data?.graphemeLength} / {MAX_LENGTH}
          </Text>
          <TouchableOpacity
            accessibilityRole="button"
            disabled={isEmpty || send.isLoading}
            className="ml-3 flex-row items-center rounded-full bg-neutral-800 px-3 py-2 dark:bg-neutral-200"
            onPress={() => send.mutate()}
          >
            <Text className="mr-2 text-white dark:text-black">Post</Text>
            <Send
              size={12}
              color={colorScheme === "light" ? "white" : "black"}
            />
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
});
Composer.displayName = "Composer";

const MemoizedComposer = memo(Composer);

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

const getGalleryPermission = async () => {
  const canChoosePhoto = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (!canChoosePhoto.granted) {
    if (canChoosePhoto.canAskAgain) {
      const { granted } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Please enable photo gallery access in your settings",
        );
        return false;
      }
    } else {
      Alert.alert(
        "Permission required",
        "Please enable photo gallery access in your settings",
      );
      return false;
    }
  }
  return true;
};

const getCameraPermission = async () => {
  const canTakePhoto = await ImagePicker.getCameraPermissionsAsync();
  if (!canTakePhoto.granted) {
    if (canTakePhoto.canAskAgain) {
      const { granted } = await ImagePicker.requestCameraPermissionsAsync();
      if (!granted) {
        Alert.alert(
          "Permission required",
          "Please enable camera access in your settings",
        );
        return false;
      }
    } else {
      Alert.alert(
        "Permission required",
        "Please enable camera access in your settings",
      );
      return false;
    }
  }
  return true;
};
