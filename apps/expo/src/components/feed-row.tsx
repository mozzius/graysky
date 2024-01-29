import { useEffect } from "react";
import {
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ShadowDecorator } from "react-native-draggable-flatlist";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { Link, usePathname, useRouter } from "expo-router";
import { AppBskyFeedDefs, type AppBskyGraphDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import {
  ChevronRightIcon,
  EqualIcon,
  HeartIcon,
  MinusCircleIcon,
  StarIcon,
} from "lucide-react-native";

import { useAbsolutePath } from "~/lib/absolute-path-context";
import { useHaptics } from "~/lib/hooks/preferences";
import { actionSheetStyles } from "~/lib/utils/action-sheet";
import { cx } from "~/lib/utils/cx";
import { Text } from "./themed/text";

interface Props {
  feed: AppBskyFeedDefs.GeneratorView | AppBskyGraphDefs.ListView;
  children?: React.ReactNode;
  large?: boolean;
  onPress?: () => void;
  right?: React.ReactNode;
  replace?: boolean;
}

export const FeedRow = ({
  feed,
  children,
  large,
  onPress,
  right,
  replace,
}: Props) => {
  const router = useRouter();
  const theme = useTheme();
  const path = useAbsolutePath();
  const pathname = usePathname();

  let segment;
  let name;
  let likes;
  let purpose;
  if (sketchyIsGeneratorView(feed)) {
    segment = "feed";
    name = feed.displayName;
    likes = `, ${feed.likeCount} likes`;
  } else {
    segment = "lists";
    name = feed.name;
    switch (feed.purpose) {
      case "app.bsky.graph.defs#curatelist":
        purpose = "User list";
        break;
      case "app.bsky.graph.defs#modlist":
        purpose = "Moderation list";
        break;
    }
  }

  const href = path(
    `/profile/${feed.creator.did}/${segment}/${feed.uri.split("/").pop()}`,
  );

  return (
    <TouchableHighlight
      onPress={() => {
        onPress?.();
        if (pathname === "/discover") router.navigate("../");
        if (replace) {
          router.replace(href);
        } else {
          router.push(href);
        }
      }}
      accessibilityLabel={
        large
          ? `${name} feed by @${feed.creator.handle}${likes}`
          : `${name} feed`
      }
      accessibilityRole="link"
    >
      <View
        style={{ backgroundColor: theme.colors.card }}
        className="flex-row items-center px-4 py-3"
        accessibilityElementsHidden
      >
        {feed.avatar ? (
          <Image
            source={{ uri: feed.avatar }}
            recyclingKey={feed.avatar}
            alt={name}
            className={cx(
              "shrink-0 items-center justify-center rounded bg-blue-500",
              large ? "h-10 w-10" : "h-6 w-6",
            )}
          />
        ) : (
          <View
            className={cx(
              "shrink-0 rounded bg-blue-500",
              large ? "h-10 w-10" : "h-6 w-6",
            )}
          />
        )}
        <View className="mx-3 flex-1 flex-row items-center">
          <View>
            <Text className="text-base" numberOfLines={1}>
              {name}
            </Text>
            {large && (
              <Text
                className={cx(
                  "text-sm",
                  theme.dark ? "text-neutral-400" : "text-neutral-500",
                )}
                numberOfLines={1}
              >
                {sketchyIsGeneratorView(feed) ? (
                  <>
                    <HeartIcon
                      fill="currentColor"
                      className={
                        feed.viewer?.like
                          ? "text-red-500"
                          : theme.dark
                            ? "text-neutral-500"
                            : "text-neutral-400"
                      }
                      size={12}
                    />{" "}
                    <Text
                      className={
                        theme.dark ? "text-neutral-400" : "text-neutral-500"
                      }
                      style={{ fontVariant: ["tabular-nums"] }}
                    >
                      {feed.likeCount ?? 0}
                    </Text>
                  </>
                ) : (
                  purpose
                )}{" "}
                • @{feed.creator.handle}
              </Text>
            )}
          </View>
          {children}
        </View>
        {right ?? (
          <ChevronRightIcon
            size={20}
            className={theme.dark ? "text-neutral-200" : "text-neutral-400"}
          />
        )}
      </View>
    </TouchableHighlight>
  );
};

export const DraggableFeedRow = ({
  feed,
  onPressStar,
  drag,
  editing,
  onUnsave,
}: {
  feed: (AppBskyFeedDefs.GeneratorView | AppBskyGraphDefs.ListView) & {
    pinned: boolean;
  };
  onPressStar: () => void;
  drag?: () => void;
  editing: boolean;
  onUnsave: () => void;
}) => {
  const path = useAbsolutePath();
  const href = path(
    `/profile/${feed.creator.did}/${
      AppBskyFeedDefs.isGeneratorView(feed) ? "feed" : "lists"
    }/${feed.uri.split("/").pop()}`,
  );

  const { showActionSheetWithOptions } = useActionSheet();
  const theme = useTheme();
  const haptics = useHaptics();

  const editingValue = useSharedValue(editing ? 1 : 0);

  useEffect(() => {
    editingValue.value = editing ? 1 : 0;
  }, [editing, editingValue]);

  const star = (
    <TouchableOpacity
      onPress={() => {
        haptics.impact();
        onPressStar();
      }}
      accessibilityLabel={feed.pinned ? "Favourited" : "Not favourited"}
      accessibilityRole="togglebutton"
      accessibilityHint="Toggle favourite status"
    >
      <StarIcon
        size={20}
        className={
          feed.pinned
            ? theme.dark
              ? "text-yellow-500"
              : "text-yellow-400"
            : theme.dark
              ? "text-neutral-800"
              : "text-neutral-200"
        }
        fill="currentColor"
      />
    </TouchableOpacity>
  );

  const leftContainerStyle = useAnimatedStyle(() => {
    return {
      right: withTiming(editingValue.value * -32),
    };
  });

  const rightContainerStyle = useAnimatedStyle(() => {
    return {
      left: withTiming(editingValue.value * -32),
    };
  });

  const deleteStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(editingValue.value),
    };
  });

  const handleStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(editingValue.value),
    };
  });

  return (
    <ShadowDecorator>
      <Link href={href} asChild>
        <TouchableHighlight>
          <View
            className={cx(
              "flex-row items-center px-4 py-3",
              theme.dark ? "bg-black" : "bg-white",
            )}
          >
            <Animated.View
              style={leftContainerStyle}
              className="relative flex-1 flex-row items-center"
            >
              <Animated.View
                style={deleteStyle}
                className="absolute right-full"
                accessibilityElementsHidden={editing ? false : true}
              >
                <TouchableOpacity
                  onPress={() => {
                    haptics.impact();
                    showActionSheetWithOptions(
                      {
                        title: "Unsave this feed?",
                        options: ["Unsave", "Cancel"],
                        cancelButtonIndex: 1,
                        destructiveButtonIndex: 0,
                        ...actionSheetStyles(theme),
                      },
                      (index) => {
                        if (index === 0) {
                          onUnsave();
                        }
                      },
                    );
                  }}
                >
                  <View className="mr-1 px-2 py-0.5">
                    <MinusCircleIcon
                      size={24}
                      fill="red"
                      color={theme.dark ? "black" : "white"}
                    />
                  </View>
                </TouchableOpacity>
              </Animated.View>
              <Image
                source={{ uri: feed.avatar }}
                alt={
                  AppBskyFeedDefs.isGeneratorView(feed)
                    ? feed.displayName
                    : feed.name
                }
                className="h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500"
              />
              <View className="flex-1 px-3">
                <Text className="text-base">
                  {AppBskyFeedDefs.isGeneratorView(feed)
                    ? feed.displayName
                    : feed.name}
                </Text>
              </View>
            </Animated.View>
            {drag ? (
              <Animated.View
                style={rightContainerStyle}
                className="relative flex-row items-center"
                accessibilityElementsHidden={editing ? false : true}
              >
                {star}
                <Animated.View
                  style={handleStyle}
                  className="absolute left-full"
                  pointerEvents={editing ? "auto" : "none"}
                >
                  <TouchableWithoutFeedback onPressIn={drag}>
                    <View className="ml-1 px-2 py-0.5">
                      <EqualIcon size={20} color={theme.colors.text} />
                    </View>
                  </TouchableWithoutFeedback>
                </Animated.View>
              </Animated.View>
            ) : (
              star
            )}
          </View>
        </TouchableHighlight>
      </Link>
    </ShadowDecorator>
  );
};

// no $type, so we need to make a sketchy guess based on ATURI
function sketchyIsGeneratorView(
  feed: AppBskyFeedDefs.GeneratorView | AppBskyGraphDefs.ListView,
): feed is AppBskyFeedDefs.GeneratorView {
  return feed.uri.includes("app.bsky.feed.generator");
}
