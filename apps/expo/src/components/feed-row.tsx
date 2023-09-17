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
import { Link, useNavigation, useRouter } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import {
  ChevronRightIcon,
  EqualIcon,
  HeartIcon,
  MinusCircleIcon,
  StarIcon,
} from "lucide-react-native";
import { useColorScheme } from "nativewind";

import { useHaptics } from "~/lib/hooks/preferences";
import { cx } from "~/lib/utils/cx";
import { Text } from "./text";

interface Props {
  feed: AppBskyFeedDefs.GeneratorView;
  children?: React.ReactNode;
  large?: boolean;
}

export const FeedRow = ({ feed, children, large }: Props) => {
  const router = useRouter();
  const theme = useTheme();
  const href = `/profile/${feed.creator.did}/feed/${feed.uri.split("/").pop()}`;
  const navigation = useNavigation();
  return (
    <TouchableHighlight
      onPress={() => {
        if (navigation.getState().routes.at(-1)?.name === "feeds/discover")
          router.push("../");
        router.push(href);
      }}
    >
      <View
        style={{ backgroundColor: theme.colors.card }}
        className="flex-row items-center px-4 py-3"
      >
        <Image
          source={{ uri: feed.avatar }}
          alt={feed.displayName}
          className={cx(
            "shrink-0 items-center justify-center rounded bg-blue-500",
            large ? "h-10 w-10" : "h-6 w-6",
          )}
        />
        <View className="mx-3 flex-1 flex-row items-center">
          <View>
            <Text className="text-base" numberOfLines={1}>
              {feed.displayName}
            </Text>
            {large && (
              <Text
                className={cx(
                  "text-sm",
                  theme.dark ? "text-neutral-400" : "text-neutral-500",
                )}
                numberOfLines={1}
              >
                <HeartIcon
                  fill="currentColor"
                  className={
                    feed.viewer?.like
                      ? "text-red-500"
                      : theme.dark
                      ? "text-neutral-400"
                      : "text-neutral-500"
                  }
                  size={12}
                />{" "}
                <Text className="tabular-nums">{feed.likeCount ?? 0}</Text> • @
                {feed.creator.handle}
              </Text>
            )}
          </View>
          {children}
        </View>
        <ChevronRightIcon
          size={20}
          className={theme.dark ? "text-neutral-200" : "text-neutral-400"}
        />
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
  feed: AppBskyFeedDefs.GeneratorView & { pinned: boolean };
  onPressStar: () => void;
  drag?: () => void;
  editing: boolean;
  onUnsave: () => void;
}) => {
  const href = `/profile/${feed.creator.did}/feed/${feed.uri.split("/").pop()}`;

  const { showActionSheetWithOptions } = useActionSheet();
  const theme = useTheme();
  const haptics = useHaptics();
  const { colorScheme } = useColorScheme();

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
                        userInterfaceStyle: theme.dark ? "dark" : "light",
                        textStyle: { color: theme.colors.text },
                        containerStyle: { backgroundColor: theme.colors.card },
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
                alt={feed.displayName}
                className="h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500"
              />
              <View className="flex-1 px-3">
                <Text className="text-base">{feed.displayName}</Text>
              </View>
            </Animated.View>
            {drag ? (
              <Animated.View
                style={rightContainerStyle}
                className="relative flex-row items-center"
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
