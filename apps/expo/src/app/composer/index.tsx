import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  findNodeHandle,
  Keyboard,
  Platform,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  FadeInDown,
  FadeOut,
  FadeOutDown,
  FadeOutLeft,
  LinearTransition,
  SlideInUp,
  SlideOutUp,
} from "react-native-reanimated";
import { Image } from "expo-image";
import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import {
  RichText as RichTextHelper,
  type AppBskyEmbedExternal,
  type AppBskyEmbedRecord,
} from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  CheckIcon,
  LanguagesIcon,
  PaperclipIcon,
  PlusIcon,
  XIcon,
} from "lucide-react-native";
import colors from "tailwindcss/colors";

import { Avatar } from "~/components/avatar";
import { Embed } from "~/components/embed";
import { FeedPost } from "~/components/feed-post";
import { RichText } from "~/components/rich-text";
import { Text } from "~/components/themed/text";
import { TextInput } from "~/components/themed/text-input";
import { useAgent } from "~/lib/agent";
import { AltTextEditor } from "~/lib/composer/alt-text-editor";
import { CancelButton, PostButton } from "~/lib/composer/buttons";
import { KeyboardAccessory } from "~/lib/composer/keyboard-accessory";
import { SuggestionList } from "~/lib/composer/suggestion-list";
import {
  MAX_IMAGES,
  MAX_LENGTH,
  useExternal,
  useImages,
  useQuote,
  useReply,
  useSendPost,
} from "~/lib/composer/utils";
import {
  useAppPreferences,
  useContentFilter,
  useHaptics,
} from "~/lib/hooks/preferences";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
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
  const [{ primaryLanguage }] = useAppPreferences();

  const navigation = useNavigation();
  const { contentFilter } = useContentFilter();
  const [trucateParent, setTruncateParent] = useState(true);

  const searchParams = useLocalSearchParams<{ gif: string; langs: string }>();

  const gif = searchParams.gif
    ? (JSON.parse(searchParams.gif) as {
        view: AppBskyEmbedExternal.View;
        main: AppBskyEmbedExternal.Main;
      })
    : null;
  const languages = searchParams.langs?.split(",");

  const selectionRef = useRef<Selection>({
    start: 0,
    end: 0,
  });
  const inputRef = useRef<TextInput>(null!);
  const keyboardScrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const anchorRef = useRef<TouchableOpacity>(null);
  const keyboardMaxHeight = useKeyboardMaxHeight();

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
    placeholderData: keepPreviousData,
  });

  const suggestions = suggestionsQuery.data ?? [];

  const isEmpty = text.trim().length === 0 && images.length === 0 && !gif;

  const send = useSendPost({
    text,
    images,
    reply: reply.ref,
    quote: quote.ref,
    external: external.query.data,
    gif: gif?.main,
    languages,
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
        keyboardHeight={keyboardMaxHeight}
      />
    );
  }

  return (
    <View
      className="relative flex-1"
      style={{ backgroundColor: theme.colors.card }}
    >
      <Stack.Screen
        options={{
          headerBackVisible: false,
          headerLeft: () => (
            <CancelButton
              hasContent={!isEmpty}
              onSave={() => Alert.alert("Not yet implemented")}
              onCancel={() => {
                inputRef.current.focus();
              }}
              disabled={send.isPending}
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
                        ...actionSheetStyles(theme),
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
                send.isPending ||
                (rt.graphemeLength ?? 0) > MAX_LENGTH
              }
              loading={send.isPending}
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
          layout={LinearTransition}
        >
          <Text className="text-base font-medium leading-5 text-white">
            {send.error instanceof Error
              ? send.error.message
              : "An unknown error occurred"}
          </Text>
          <Text className="my-0.5 text-white/90">Please try again</Text>
        </Animated.View>
      )}
      <Animated.View layout={LinearTransition} className="flex-1">
        <KeyboardAwareScrollView
          ref={keyboardScrollViewRef}
          className="py-4"
          alwaysBounceVertical={!isEmpty}
          keyboardShouldPersistTaps="handled"
          extraScrollHeight={64}
        >
          {reply.thread.data && (
            <TouchableOpacity
              onPress={() => setTruncateParent((t) => !t)}
              className="flex-1"
            >
              <Animated.View
                layout={LinearTransition}
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
            layout={LinearTransition}
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
                  placeholder={
                    reply.thread.data
                      ? `Replying to @${reply.thread.data.post.author.handle}`
                      : `What's on your mind?`
                  }
                  keyboardType={Platform.select({
                    ios: "twitter",
                    default: "default",
                  })}
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
                        193,
                      );
                    }
                  }}
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
              exiting={FadeOut}
              layout={LinearTransition}
              keyboardShouldPersistTaps="handled"
            >
              {images.map((image, i) => (
                <Animated.View
                  key={image.asset.uri}
                  className={cx(
                    "relative overflow-hidden rounded-md",
                    i !== 3 && "mr-2",
                  )}
                  layout={LinearTransition}
                  exiting={FadeOutLeft}
                >
                  <AnimatedImage
                    // sharedTransitionTag={`image-${i}`}
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
                <Animated.View
                  layout={LinearTransition}
                  className="mr-20 flex-1"
                >
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
          <Animated.View
            layout={LinearTransition}
            className="w-full flex-1 pl-16 pr-2"
          >
            {/* GIF */}
            {gif && (
              <Animated.View
                className="relative mb-2 flex-1"
                layout={LinearTransition}
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
                layout={LinearTransition}
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
      <KeyboardAccessory charCount={rt.graphemeLength}>
        <TouchableHighlight
          className="rounded-full"
          accessibilityLabel="Add image or GIF"
          accessibilityRole="button"
          onPress={() => {
            haptics.impact();
            imagePicker.mutate();
          }}
        >
          <View
            className="h-9 flex-row items-center justify-center rounded-full px-2.5"
            style={{
              backgroundColor: theme.dark
                ? colors.neutral[800]
                : theme.colors.background,
            }}
          >
            <PaperclipIcon size={20} />
            <Text
              style={{ color: theme.colors.primary }}
              className="ml-2.5 mr-1 font-medium"
            >
              Add image
            </Text>
          </View>
        </TouchableHighlight>
        <TouchableHighlight
          className="rounded-full"
          accessibilityLabel="Add image or GIF"
          accessibilityRole="button"
          onPress={() => {
            haptics.impact();
            const search = new URLSearchParams();
            if (searchParams.langs) search.append("langs", searchParams.langs);
            if (searchParams.gif) search.append("gif", searchParams.gif);
            router.push("/composer/language?" + search.toString());
          }}
        >
          <View
            className="h-9 flex-row items-center justify-center rounded-full px-2.5"
            style={{
              backgroundColor: theme.dark
                ? colors.neutral[800]
                : theme.colors.background,
            }}
          >
            <LanguagesIcon size={20} />
            <Text
              style={{ color: theme.colors.primary }}
              className="ml-2.5 mr-1 font-medium uppercase"
            >
              {languages?.join(", ") ?? primaryLanguage}
            </Text>
          </View>
        </TouchableHighlight>
      </KeyboardAccessory>
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
    case "pending":
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
