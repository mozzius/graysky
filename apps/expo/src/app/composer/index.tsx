import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ContextMenuButton } from "react-native-ios-context-menu";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  FadeOutDown,
  Layout,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Link, Stack, useNavigation, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppBskyEmbedRecord, RichText as RichTextHelper } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { Check, Paperclip, Plus, Send, X } from "lucide-react-native";

import { Avatar } from "../../components/avatar";
import { Embed } from "../../components/embed";
import { FeedPost } from "../../components/feed-post";
import { RichText } from "../../components/rich-text";
import { useAgent } from "../../lib/agent";
import {
  MAX_IMAGES,
  MAX_LENGTH,
  useImages,
  useQuote,
  useReply,
  useSendPost,
} from "../../lib/hooks/composer";
import { useContentFilter } from "../../lib/hooks/preferences";
import { cx } from "../../lib/utils/cx";
import { getMentionAt, insertMentionAt } from "../../lib/utils/mention-suggest";

interface Selection {
  start: number;
  end: number;
}

export default function ComposerScreen() {
  const theme = useTheme();
  const agent = useAgent();

  const navigation = useNavigation();
  const { contentFilter } = useContentFilter();
  const [trucateParent, setTruncateParent] = useState(true);

  const selectionRef = useRef<Selection>({
    start: 0,
    end: 0,
  });
  const textRef = useRef<TextInput>(null);

  const reply = useReply();
  const quote = useQuote();

  const [text, setText] = useState("");
  const { images, imagePicker, addAltText, removeImage } = useImages();

  const rt = useMemo(() => {
    const rt = new RichTextHelper({ text });
    rt.detectFacetsWithoutResolution();
    return rt;
  }, [text]);

  const prefix = useMemo(() => {
    return getMentionAt(text, selectionRef.current?.start || 0);
  }, [text]);

  const isSuggestionsOpen = !!prefix;

  const suggestionsQuery = useQuery({
    enabled: isSuggestionsOpen,
    queryKey: ["suggestions", prefix?.value],
    queryFn: async () => {
      if (!prefix || !prefix.value) return [];
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
  const isEmpty = text.trim().length === 0 && images.length === 0;

  const send = useSendPost({
    text,
    images,
    reply: reply.ref,
    record: quote.ref,
  });

  useEffect(() => {
    navigation.getParent()?.setOptions({ gestureEnabled: isEmpty });
  }, [navigation, isEmpty]);

  return (
    <View className="flex-1" style={{ backgroundColor: theme.colors.card }}>
      <Stack.Screen
        options={{
          headerLeft: () => (
            <CancelButton
              hasContent={!isEmpty}
              onSave={() => Alert.alert("Not yet implemented")}
              disabled={send.isLoading}
            />
          ),

          headerRight: () => (
            <PostButton
              onPress={send.mutate}
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
        <View className="bg-red-500 px-4 py-3">
          <Text className="text-lg font-medium leading-6 text-white">
            {send.error instanceof Error
              ? send.error.message
              : "An unknown error occurred"}
          </Text>
          <Text className="my-1 text-white/90">Please try again</Text>
        </View>
      )}
      <KeyboardAwareScrollView
        className="pt-4"
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
        <Animated.View className="w-full flex-row px-2 pb-6" layout={Layout}>
          <View className="shrink-0 px-2">
            <Avatar size="medium" />
          </View>
          <View className="flex flex-1 items-start pl-1 pr-2">
            <View className="min-h-[40px] flex-1 flex-row items-center">
              <TextInput
                ref={textRef}
                onChange={(evt) => {
                  setText(evt.nativeEvent.text);
                  if (send.isError) {
                    send.reset();
                  }
                }}
                multiline
                className="relative -top-[3px] w-full text-lg leading-6"
                placeholder="What's on your mind?"
                placeholderTextColor={theme.dark ? "#555" : "#aaa"}
                verticalAlign="middle"
                textAlignVertical="center"
                autoFocus
                onSelectionChange={(evt) => {
                  selectionRef.current = evt.nativeEvent.selection;
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
                <Animated.View
                  entering={FadeInDown}
                  exiting={FadeOut}
                  layout={Layout}
                  className="mt-2"
                >
                  {suggestions.map((actor) => (
                    <TouchableOpacity
                      key={actor.did}
                      onPress={() => {
                        setText((text) =>
                          insertMentionAt(
                            text,
                            selectionRef.current?.start || 0,
                            actor.handle,
                          ),
                        );
                      }}
                    >
                      <Animated.View
                        entering={FadeIn}
                        className="flex-row items-center p-1"
                      >
                        <Image
                          className="mr-2.5 h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-600"
                          source={{ uri: actor.avatar }}
                        />
                        <View>
                          {actor.displayName && (
                            <Text
                              className="text-base font-medium"
                              style={{ color: theme.colors.text }}
                              numberOfLines={1}
                            >
                              {actor.displayName}
                            </Text>
                          )}
                          <Text
                            className="text-sm text-neutral-500"
                            numberOfLines={1}
                          >
                            @{actor.handle}
                          </Text>
                        </View>
                      </Animated.View>
                    </TouchableOpacity>
                  ))}
                </Animated.View>
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
              >
                <Paperclip
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
              {(rt.graphemeLength ?? 0) > MAX_LENGTH * 0.66 && (
                <Animated.Text
                  style={{
                    color: !tooLong
                      ? theme.colors.text
                      : theme.colors.notification,
                  }}
                  entering={FadeIn}
                  exiting={FadeOut}
                  className="text-right font-medium"
                >
                  {rt.graphemeLength} / {MAX_LENGTH}
                </Animated.Text>
              )}
            </Animated.View>
            {/* IMAGES */}
            {images.length > 0 && (
              <Animated.ScrollView
                horizontal
                className="mt-4 flex-1 pb-2"
                entering={FadeInDown}
                exiting={FadeOutDown}
                layout={Layout}
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
                    <Image
                      cachePolicy="memory"
                      source={{ uri: image.asset.uri }}
                      alt={`image ${i}}`}
                      className="h-44"
                      style={{
                        aspectRatio: Math.max(
                          0.6,
                          image.asset.width / image.asset.height,
                        ),
                      }}
                    />
                    <TouchableOpacity
                      className="absolute left-2 top-2 z-10"
                      onPress={() => {
                        void Haptics.impactAsync();
                        Alert.prompt(
                          "Add a caption",
                          undefined,
                          (alt) => {
                            if (alt !== null) {
                              addAltText(i, alt);
                            }
                          },
                          undefined,
                          image.alt,
                        );
                      }}
                    >
                      <View className="flex-row items-center rounded-full bg-black/90 px-2 py-[3px]">
                        {image.alt ? (
                          <Check size={14} color="white" />
                        ) : (
                          <Plus size={14} color="white" />
                        )}
                        <Text className="ml-1 text-xs font-bold uppercase text-white">
                          Alt
                        </Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="absolute right-2 top-2 z-10"
                      onPress={() => {
                        void Haptics.impactAsync();
                        removeImage(i);
                      }}
                    >
                      <View className="rounded-full bg-black/90 p-1">
                        <X size={14} color="white" />
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
                  <Animated.View layout={Layout}>
                    <TouchableOpacity
                      onPress={() => {
                        void Haptics.impactAsync();
                        imagePicker.mutate();
                      }}
                    >
                      <View className="h-44 w-32 items-center justify-center rounded border border-neutral-200 dark:border-neutral-500">
                        <Plus color={theme.colors.text} />
                        <Text
                          style={{ color: theme.colors.text }}
                          className="mt-2 text-center"
                        >
                          Add image
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                )}
              </Animated.ScrollView>
            )}
            {quote.thread.data && (
              <Animated.View
                layout={Layout}
                entering={FadeInDown}
                className="mt-4 w-full flex-1"
                pointerEvents="none"
              >
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
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </KeyboardAwareScrollView>
      <StatusBar style="light" />
    </View>
  );
}

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
      <TouchableOpacity disabled={disabled} onPress={onPress}>
        <View
          className={cx(
            "relative flex-row items-center overflow-hidden rounded-full px-4 py-1",
            disabled && "opacity-50",
          )}
          style={{ backgroundColor: theme.colors.primary }}
        >
          <Text className="mr-2 text-base font-medium text-white">Post</Text>
          <Send size={12} className="text-white" />
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
      </TouchableOpacity>
    </View>
  );
};

const CancelButton = ({
  hasContent,
  onSave,
  disabled,
}: {
  hasContent: boolean;
  onSave: () => void;
  disabled?: boolean;
}) => {
  const theme = useTheme();
  const router = useRouter();

  if (hasContent) {
    return (
      <ContextMenuButton
        isMenuPrimaryAction={true}
        accessibilityLabel="Save or discard post"
        accessibilityRole="button"
        enableContextMenu={!disabled}
        menuConfig={{
          menuTitle: "",
          menuItems: [
            // {
            //   actionKey: "save",
            //   actionTitle: "Save to drafts",
            //   icon: {
            //     type: "IMAGE_SYSTEM",
            //     imageValue: {
            //       systemName: "square.and.arrow.down",
            //     },
            //   },
            // },
            {
              actionKey: "discard",
              actionTitle: "Discard post",
              icon: {
                type: "IMAGE_SYSTEM",
                imageValue: {
                  systemName: "trash",
                },
              },
              menuAttributes: ["destructive"],
            },
          ],
        }}
        onPressMenuItem={(evt) => {
          switch (evt.nativeEvent.actionKey) {
            case "save":
              onSave();
              break;
            case "discard":
              router.push("../");
              break;
          }
        }}
      >
        <TouchableOpacity>
          <Text style={{ color: theme.colors.primary }} className="text-lg">
            Cancel
          </Text>
        </TouchableOpacity>
      </ContextMenuButton>
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
