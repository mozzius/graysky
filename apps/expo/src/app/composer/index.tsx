import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  findNodeHandle,
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  Layout,
  SlideInUp,
  SlideOutUp,
} from "react-native-reanimated";
import { useSafeAreaFrame } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  Link,
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import {
  RichText as RichTextHelper,
  type AppBskyActorDefs,
  type AppBskyEmbedExternal,
  type AppBskyEmbedRecord,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useHeaderHeight } from "@react-navigation/elements";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import {
  CheckIcon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
  UserIcon,
  XIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { Avatar } from "~/components/avatar";
import { Embed } from "~/components/embed";
import { FeedPost } from "~/components/feed-post";
import { RichText } from "~/components/rich-text";
import { Text } from "~/components/text";
import { useAgent } from "~/lib/agent";
import {
  MAX_IMAGES,
  MAX_LENGTH,
  useExternal,
  useImages,
  useQuote,
  useReply,
  useSendPost,
  type ImageWithAlt,
} from "~/lib/hooks/composer";
import { useContentFilter, useHaptics } from "~/lib/hooks/preferences";
import { cx } from "~/lib/utils/cx";
import { getMentionAt, insertMentionAt } from "~/lib/utils/mention-suggest";

const AnimatedImage = Animated.createAnimatedComponent(Image);

interface Selection {
  start: number;
  end: number;
}

function useKeyboardMaxHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", (e) =>
      setKeyboardHeight((h) => Math.max(e.endCoordinates.height, h)),
    );
    return () => {
      sub.remove();
    };
  }, [setKeyboardHeight]);

  return keyboardHeight;
}

export default function ComposerScreen() {
  const theme = useTheme();
  const agent = useAgent();
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();

  const navigation = useNavigation();
  const { contentFilter } = useContentFilter();
  const [trucateParent, setTruncateParent] = useState(true);

  const searchParams = useLocalSearchParams<{ gif: string }>();

  const gif = searchParams.gif
    ? (JSON.parse(searchParams.gif) as {
        view: AppBskyEmbedExternal.View;
        main: AppBskyEmbedExternal.Main;
      })
    : null;

  const selectionRef = useRef<Selection>({
    start: 0,
    end: 0,
  });
  const inputRef = useRef<TextInput>(null!);
  const keyboardScrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const anchorRef = useRef<TouchableOpacity>(null);

  const reply = useReply();
  const quote = useQuote();
  const haptics = useHaptics();

  const [text, setText] = useState("");

  const { images, imagePicker, addAltText, removeImage } = useImages(anchorRef);

  const [editingAltText, setEditingAltText] = useState<number | null>(null);

  const rt = useMemo(() => {
    const rt = new RichTextHelper({ text });
    rt.detectFacetsWithoutResolution();
    return rt;
  }, [text]);

  const { external, selectExternal, potentialExternalEmbeds, hasExternal } =
    useExternal(rt.facets);

  const prefix = useMemo(() => {
    return getMentionAt(text, selectionRef.current?.start || 0);
  }, [text]);

  const isSuggestionsOpen = !!prefix;

  const suggestionsQuery = useQuery({
    enabled: isSuggestionsOpen,
    queryKey: ["suggestions", prefix?.value],
    queryFn: async () => {
      if (!prefix?.value) return [];
      const actors = await agent.searchActorsTypeahead({
        term: prefix.value,
        limit: 10,
      });
      if (!actors.success) throw new Error("Cannot fetch suggestions");
      return actors.data.actors;
    },
    keepPreviousData: true,
  });

  const suggestions = suggestionsQuery.data ?? [];

  const tooLong = (rt.graphemeLength ?? 0) > MAX_LENGTH;
  const isEmpty = text.trim().length === 0 && images.length === 0 && !gif;

  const send = useSendPost({
    text,
    images,
    reply: reply.ref,
    quote: quote.ref,
    external: external.query.data,
    gif: gif?.main,
  });

  useEffect(() => {
    navigation.getParent()?.setOptions({ gestureEnabled: isEmpty });
  }, [navigation, isEmpty]);

  if (editingAltText !== null) {
    const image = images[editingAltText]!;
    return (
      <AltTextEditor
        image={image}
        editingAltText={editingAltText}
        setEditingAltText={setEditingAltText}
        addAltText={addAltText}
      />
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <CancelButton
              hasContent={!isEmpty}
              onSave={() => Alert.alert("Not yet implemented")}
              onCancel={() => {
                inputRef.current.focus();
              }}
              disabled={send.isLoading}
            />
          ),
          headerRight: () => (
            <PostButton
              onPress={async () => {
                haptics.impact();

                if (images.some((i) => !i.alt)) {
                  const cancel = await new Promise((resolve) => {
                    showActionSheetWithOptions(
                      {
                        title: "Missing alt text",
                        message:
                          "Adding a description to your image makes Bluesky more accessible to people with disabilities, and helps give context to everyone. We strongly recommend adding alt text to all images.",
                        options: ["Post anyway", "Go back"],
                        destructiveButtonIndex: 0,
                        cancelButtonIndex: 1,
                        userInterfaceStyle: theme.dark ? "dark" : "light",
                        textStyle: { color: theme.colors.text },
                        containerStyle: { backgroundColor: theme.colors.card },
                      },
                      (index) => resolve(index === 1),
                    );
                  });
                  if (cancel) return;
                }

                send.mutate();
              }}
              disabled={
                isEmpty ||
                send.isLoading ||
                (rt.graphemeLength ?? 0) > MAX_LENGTH
              }
              loading={send.isLoading}
            />
          ),
          headerTitleStyle: { color: "transparent" },
        }}
      />
      {send.isError && (
        <Animated.View
          className="bg-red-500 px-4 py-3"
          entering={SlideInUp}
          exiting={SlideOutUp}
          layout={Layout}
        >
          <Text className="text-base font-medium leading-5 text-white">
            {send.error instanceof Error
              ? send.error.message
              : "An unknown error occurred"}
          </Text>
          <Text className="my-0.5 text-white/90">Please try again</Text>
        </Animated.View>
      )}
      <Animated.View layout={Layout} className="flex-1">
        <KeyboardAwareScrollView
          ref={keyboardScrollViewRef}
          className="py-4"
          alwaysBounceVertical={!isEmpty}
          keyboardShouldPersistTaps="handled"
        >
          {reply.thread.data && (
            <TouchableOpacity
              onPress={() => setTruncateParent((t) => !t)}
              className="flex-1"
            >
              <Animated.View
                layout={Layout}
                pointerEvents="none"
                className="flex-1"
              >
                <FeedPost
                  item={reply.thread.data}
                  dataUpdatedAt={0}
                  filter={contentFilter(reply.thread.data.post.labels)}
                  hasReply
                  isReply
                  hideActions
                  hideEmbed={trucateParent}
                  numberOfLines={trucateParent ? 3 : undefined}
                  avatarSize="reduced"
                  background="transparent"
                />
              </Animated.View>
            </TouchableOpacity>
          )}
          <Animated.View
            className="w-full flex-1 flex-row px-2 pb-6"
            layout={Layout}
          >
            <View className="shrink-0 px-2">
              <Avatar size="medium" />
            </View>
            <View className="flex flex-1 items-start pl-1 pr-2">
              <View className="min-h-[40px] flex-1 flex-row items-center">
                <TextInput
                  ref={inputRef}
                  onChange={(evt) => {
                    setText(evt.nativeEvent.text);
                    if (send.isError) {
                      send.reset();
                    }
                  }}
                  multiline
                  className="relative -top-[3px] w-full text-lg leading-6"
                  style={{ color: theme.colors.text }}
                  placeholder={
                    reply.thread.data
                      ? `Replying to @${reply.thread.data.post.author.handle}`
                      : `What's on your mind?`
                  }
                  placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
                  verticalAlign="middle"
                  textAlignVertical="center"
                  autoFocus
                  onSelectionChange={(evt) => {
                    selectionRef.current = evt.nativeEvent.selection;
                  }}
                  scrollEnabled={false}
                  onContentSizeChange={(evt) => {
                    if (keyboardScrollViewRef.current) {
                      keyboardScrollViewRef.current.scrollToFocusedInput(
                        findNodeHandle(evt.target) || {},
                        75,
                      );
                    }
                  }}
                  keyboardAppearance={theme.dark ? "dark" : "light"}
                >
                  <RichText
                    size="lg"
                    text={rt.text}
                    facets={rt.facets}
                    truncate={false}
                    disableLinks
                  />
                </TextInput>
              </View>
              {/* AUTOSUGGESTIONS */}
              {isSuggestionsOpen &&
                suggestions.length > 0 &&
                !suggestions.some((s) => s.handle === prefix.value) && (
                  <SuggestionList
                    suggestions={suggestions}
                    onInsertHandle={(handle) =>
                      setText((text) =>
                        insertMentionAt(
                          text,
                          selectionRef.current?.start || 0,
                          handle,
                        ),
                      )
                    }
                  />
                )}
              {/* BUTTONS AND STUFF */}
              <Animated.View
                className="w-full flex-row items-end justify-between"
                layout={Layout}
              >
                <TouchableOpacity
                  className="mt-4 flex-row items-center"
                  hitSlop={8}
                  onPress={() => imagePicker.mutate()}
                  ref={anchorRef}
                >
                  <PaperclipIcon
                    size={18}
                    className={
                      theme.dark ? "text-neutral-400" : "text-neutral-500"
                    }
                  />

                  <Animated.Text
                    className={cx(
                      "ml-2",
                      theme.dark ? "text-neutral-400" : "text-neutral-500",
                    )}
                    entering={FadeIn}
                    exiting={FadeOut}
                  >
                    {images.length > 0
                      ? `${images.length} / ${MAX_IMAGES} images`
                      : "Attach images"}
                  </Animated.Text>
                </TouchableOpacity>
                {(rt.graphemeLength ?? 0) > 50 && (
                  <Animated.Text
                    style={{
                      color: !tooLong
                        ? theme.colors.text
                        : theme.colors.notification,
                    }}
                    entering={FadeIn}
                    exiting={FadeOut}
                    className="text-right"
                  >
                    {rt.graphemeLength} / {MAX_LENGTH}
                  </Animated.Text>
                )}
              </Animated.View>
            </View>
          </Animated.View>
          <Animated.View />
          {/* IMAGES */}
          {!gif && images.length > 0 && (
            <Animated.ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4 w-full flex-1 pb-2 pl-16"
              entering={FadeInDown}
              exiting={FadeOutDown}
              layout={Layout}
              keyboardShouldPersistTaps="handled"
            >
              {images.map((image, i) => (
                <Animated.View
                  key={image.asset.uri}
                  className={cx(
                    "relative overflow-hidden rounded-md",
                    i !== 3 && "mr-2",
                  )}
                  layout={Layout}
                  exiting={FadeOut}
                >
                  <AnimatedImage
                    sharedTransitionTag={`image-${i}`}
                    cachePolicy="memory"
                    source={{ uri: image.asset.uri }}
                    alt={image.alt ?? `image ${i + 1}`}
                    className="h-44 rounded-md"
                    style={{
                      aspectRatio: Math.max(
                        0.6,
                        Math.min(image.asset.width / image.asset.height, 1.2),
                      ),
                    }}
                  />
                  <TouchableOpacity
                    className="absolute left-2 top-2 z-10"
                    onPress={() => {
                      haptics.impact();
                      setEditingAltText(i);
                    }}
                  >
                    <View className="flex-row items-center rounded-full bg-black/90 px-2 py-[3px]">
                      {image.alt ? (
                        <CheckIcon size={14} color="white" />
                      ) : (
                        <PlusIcon size={14} color="white" />
                      )}
                      <Text className="ml-1 text-xs font-bold uppercase text-white">
                        Alt
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="absolute right-2 top-2 z-10"
                    onPress={() => {
                      haptics.impact();
                      removeImage(i);
                    }}
                  >
                    <View className="rounded-full bg-black/90 p-1">
                      <XIcon size={14} color="white" />
                    </View>
                  </TouchableOpacity>
                  {image.alt && (
                    <View className="absolute bottom-0 left-0 right-0 z-10 bg-black/60 px-3 pb-2 pt-1">
                      <Text
                        numberOfLines={2}
                        className="text-sm leading-[18px] text-white"
                      >
                        {image.alt}
                      </Text>
                    </View>
                  )}
                </Animated.View>
              ))}
              {images.length < MAX_IMAGES && (
                <Animated.View layout={Layout} className="mr-20 flex-1">
                  <TouchableOpacity
                    onPress={() => {
                      haptics.impact();
                      imagePicker.mutate();
                    }}
                  >
                    <View
                      className="h-44 w-32 items-center justify-center rounded border"
                      style={{
                        backgroundColor: theme.colors.card,
                        borderColor: theme.colors.border,
                      }}
                    >
                      <PlusIcon color={theme.colors.text} />
                      <Text className="mt-2 text-center">Add image</Text>
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              )}
            </Animated.ScrollView>
          )}
          <Animated.View layout={Layout} className="w-full flex-1 pl-16 pr-2">
            {/* GIF */}
            {gif && (
              <Animated.View
                className="relative mb-2 flex-1"
                layout={Layout}
                entering={FadeInDown}
                exiting={FadeOutDown}
              >
                <TouchableOpacity
                  onPress={() => router.setParams({ ...searchParams, gif: "" })}
                  className="absolute right-2 top-4 z-10 rounded-full"
                >
                  <View className="rounded-full bg-black/90 p-1">
                    <XIcon size={14} color="white" />
                  </View>
                </TouchableOpacity>
                <Embed
                  uri={gif.view.external.uri}
                  transparent
                  content={gif.view}
                />
              </Animated.View>
            )}
            {/* EMBED/QUOTE */}
            {(!!quote.thread.data || hasExternal) && (
              <Animated.View
                layout={Layout}
                entering={FadeInDown}
                className="w-full flex-1"
              >
                {quote.thread.data ? (
                  <View pointerEvents="none" className="w-full flex-1">
                    <Embed
                      uri=""
                      transparent
                      content={
                        {
                          $type: "app.bsky.embed.record#view",
                          record: {
                            $type: "app.bsky.embed.record#viewRecord",
                            ...quote.thread.data.post,
                            value: quote.thread.data.post.record,
                          },
                        } satisfies AppBskyEmbedRecord.View
                      }
                    />
                  </View>
                ) : (
                  images.length === 0 &&
                  !gif &&
                  (external.url ? (
                    <View className="relative flex-1">
                      <TouchableOpacity
                        onPress={() => selectExternal(null)}
                        className="absolute right-2 top-4 z-10 rounded-full"
                      >
                        <View className="rounded-full bg-black/90 p-1">
                          <XIcon size={14} color="white" />
                        </View>
                      </TouchableOpacity>
                      <LoadableEmbed
                        url={external.url}
                        query={external.query}
                      />
                    </View>
                  ) : (
                    potentialExternalEmbeds
                      .filter((x) => x !== external.url)
                      .map((potential) => (
                        <TouchableHighlight
                          key={potential}
                          className="mb-2 rounded-lg"
                          onPress={() => selectExternal(potential)}
                        >
                          <View
                            style={{
                              backgroundColor: theme.colors.card,
                              borderColor: theme.colors.border,
                            }}
                            className="rounded-lg border px-3 py-2"
                          >
                            <Text numberOfLines={1} className="text-base">
                              Add embed for{" "}
                              <Text style={{ color: theme.colors.primary }}>
                                {potential}
                              </Text>
                            </Text>
                          </View>
                        </TouchableHighlight>
                      ))
                  ))
                )}
              </Animated.View>
            )}
          </Animated.View>
        </KeyboardAwareScrollView>
      </Animated.View>
    </View>
  );
}

const LoadableEmbed = ({
  url,
  query,
}: ReturnType<typeof useExternal>["external"]) => {
  const theme = useTheme();

  if (!url) return null;

  switch (query.status) {
    case "loading":
      return (
        <View className="w-full flex-1 py-3">
          <ActivityIndicator size="large" color={theme.colors.text} />
        </View>
      );
    case "error":
      return (
        <View className="w-full flex-1">
          <Text className="text-base font-medium text-red-500">
            {query.error instanceof Error
              ? query.error.message
              : "An unknown error occurred"}
          </Text>
        </View>
      );
    case "success":
      if (query.data === null) return null;
      return (
        <View className="w-full flex-1" pointerEvents="none">
          <Embed uri={url} transparent content={query.data.view} />
        </View>
      );
  }
};

const PostButton = ({
  onPress,
  loading,
  disabled,
}: {
  onPress: () => void;
  loading: boolean;
  disabled: boolean;
}) => {
  const theme = useTheme();

  return (
    <View className="flex-row items-center">
      <TouchableWithoutFeedback disabled={disabled} onPress={onPress}>
        <View
          className={cx(
            "relative flex-row items-center overflow-hidden rounded-full px-4 py-1",
            disabled && !loading && "opacity-50",
          )}
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="mr-2 text-base font-medium text-white">Post</Text>
          <SendIcon size={12} className="text-white" />
          {loading && (
            <Animated.View
              entering={FadeIn}
              exiting={FadeOut}
              className="absolute bottom-0 left-0 right-0 top-0 items-center justify-center"
              style={{ backgroundColor: theme.colors.primary }}
            >
              <ActivityIndicator size="small" color="white" />
            </Animated.View>
          )}
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const CancelButton = ({
  hasContent,
  onSave,
  onCancel,
  disabled,
}: {
  hasContent: boolean;
  onSave: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) => {
  const theme = useTheme();
  const router = useRouter();
  const { showActionSheetWithOptions } = useActionSheet();
  const { colorScheme } = useColorScheme();
  const haptics = useHaptics();

  const handleCancel = async () => {
    haptics.impact();
    if (Platform.OS === "android") Keyboard.dismiss();
    const options = ["Discard post", "Cancel"];
    const icons = [
      <Trash2Icon key={0} size={24} className="text-red-500" />,
      <></>,
    ];
    const selected = await new Promise((resolve) => {
      showActionSheetWithOptions(
        {
          options,
          icons,
          cancelButtonIndex: options.length - 1,
          destructiveButtonIndex: 0,
          userInterfaceStyle: colorScheme,
          textStyle: { color: theme.colors.text },
          containerStyle: { backgroundColor: theme.colors.card },
        },
        (index) => resolve(options[index!]),
      );
    });
    switch (selected) {
      case "Discard post":
        haptics.impact();
        Platform.select({
          ios: () => router.push("../"),
          default: () =>
            router.canGoBack() ? router.back() : router.replace("/feeds"),
        })();
        break;
      case "Save to drafts":
        onSave();
        break;
      default:
        onCancel();
        break;
    }
  };

  if (hasContent) {
    return (
      <TouchableOpacity
        disabled={disabled}
        accessibilityLabel="Discard post"
        onPress={() => void handleCancel()}
      >
        <Text style={{ color: theme.colors.primary }} className="text-lg">
          Cancel
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <Link href="../" asChild>
      <TouchableOpacity>
        <Text style={{ color: theme.colors.primary }} className="text-lg">
          Cancel
        </Text>
      </TouchableOpacity>
    </Link>
  );
};

const SuggestionList = ({
  suggestions,
  onInsertHandle,
}: {
  suggestions: AppBskyActorDefs.ProfileViewBasic[];
  onInsertHandle: (handle: string) => void;
}) => {
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOut}
      layout={Layout}
      className="mt-2"
    >
      {suggestions.map((actor) => {
        const { following, followedBy } = actor.viewer ?? {};

        let text: string | null = null;

        if (following && followedBy) {
          text = "You are mutuals";
        } else if (following) {
          text = "You follow them";
        } else if (followedBy) {
          text = "Follows you";
        }

        return (
          <TouchableOpacity
            key={actor.did}
            onPress={() => onInsertHandle(actor.handle)}
          >
            <Animated.View entering={FadeIn} className="flex-row p-1">
              <Image
                className="mr-2.5 mt-1.5 h-8 w-8 shrink-0 rounded-full bg-neutral-200 dark:bg-neutral-600"
                source={{ uri: actor.avatar }}
                alt={actor.displayName ?? `@${actor.handle}`}
              />
              <View>
                {actor.displayName ? (
                  <Text className="text-base font-medium" numberOfLines={1}>
                    {actor.displayName}
                  </Text>
                ) : (
                  <View className="h-2.5" />
                )}
                <Text className="text-sm text-neutral-500" numberOfLines={1}>
                  @{actor.handle}
                </Text>
                {text && (
                  <View className="my-0.5 flex-row items-center">
                    <UserIcon
                      size={12}
                      className="mr-0.5 mt-px text-neutral-500"
                      strokeWidth={3}
                    />
                    <Text className="text-xs font-medium text-neutral-500">
                      {text}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </Animated.View>
  );
};

interface AltTextEditorProps {
  image: ImageWithAlt;
  editingAltText: number;
  setEditingAltText: (index: number | null) => void;
  addAltText: (index: number, alt: string) => void;
}

const AltTextEditor = ({
  setEditingAltText,
  editingAltText,
  image,
  addAltText,
}: AltTextEditorProps) => {
  const theme = useTheme();
  const haptics = useHaptics();
  const [expandPreview, setExpandPreview] = useState(false);
  const keyboardHeight = useKeyboardMaxHeight();
  const frame = useSafeAreaFrame();
  const headerHeight = useHeaderHeight();
  const altTextScrollViewRef = useRef<KeyboardAwareScrollView>(null);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <Stack.Screen
        options={{
          headerTitle: "Edit alt text",
          headerLeft: () => null,
          headerRight: () => (
            <View className="relative justify-center">
              <TouchableOpacity
                onPress={() => {
                  haptics.selection();
                  setEditingAltText(null);
                  setExpandPreview(false);
                }}
                className="absolute right-0"
              >
                <Text
                  style={{ color: theme.colors.primary }}
                  className="text-lg font-medium"
                >
                  Done
                </Text>
              </TouchableOpacity>
              <View className="-z-50 opacity-0" pointerEvents="none">
                <PostButton
                  disabled
                  loading={false}
                  onPress={() => {
                    throw Error("unreachable");
                  }}
                />
              </View>
            </View>
          ),
          headerTitleStyle: { color: theme.colors.text },
        }}
      />
      <KeyboardAwareScrollView
        className="flex-1 px-4"
        extraScrollHeight={32}
        keyboardShouldPersistTaps="handled"
        ref={altTextScrollViewRef}
      >
        <View className="flex-1 items-center py-4">
          <TouchableWithoutFeedback
            className="flex-1"
            accessibilityLabel="Toggle expanding the image to full width"
            onPress={() => {
              haptics.impact();
              setExpandPreview((currentlyExpanded) => {
                if (!currentlyExpanded)
                  setTimeout(
                    () => altTextScrollViewRef.current?.scrollToEnd(),
                    250,
                  );
                return !currentlyExpanded;
              });
            }}
          >
            <AnimatedImage
              // doesn't work yet but on the reanimated roadmap
              sharedTransitionTag={`image-${editingAltText}`}
              layout={Layout}
              entering={FadeIn}
              cachePolicy="memory"
              source={{ uri: image.asset.uri }}
              alt={image.alt ?? `image ${editingAltText + 1}`}
              className="h-full w-full flex-1 rounded-md"
              style={{
                aspectRatio: image.asset.width / image.asset.height,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
                maxHeight: expandPreview
                  ? undefined
                  : frame.height - headerHeight - keyboardHeight - 100,
              }}
            />
          </TouchableWithoutFeedback>
        </View>
        <Animated.View className="flex-1" layout={Layout} entering={FadeIn}>
          <TextInput
            value={image.alt}
            onChange={(evt) => addAltText(editingAltText, evt.nativeEvent.text)}
            multiline
            className="min-h-[80px] flex-1 rounded-md p-2 text-base leading-5"
            numberOfLines={5}
            autoFocus
            scrollEnabled={false}
            keyboardAppearance={theme.dark ? "dark" : "light"}
            placeholderTextColor={theme.dark ? "#525255" : "#C6C6C8"}
            style={{
              color: theme.colors.text,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
            }}
            textAlignVertical="top"
            placeholder="Add a description to the image. Good alt text is concise yet detailed. Make sure to write out any text in the image itself."
          />
        </Animated.View>
      </KeyboardAwareScrollView>
    </View>
  );
};
