import { useEffect } from "react";
import {
  Text,
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
import { Link } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useActionSheet } from "@expo/react-native-action-sheet";
import { useTheme } from "@react-navigation/native";
import { ChevronRight, Equal, MinusCircle, Star } from "lucide-react-native";

interface Props {
  feed: AppBskyFeedDefs.GeneratorView;
  children?: React.ReactNode;
}

export const FeedRow = ({ feed, children }: Props) => {
  const theme = useTheme();
  const href = `/profile/${feed.creator.did}/generator/${feed.uri
    .split("/")
    .pop()}`;
  return (
    <Link href={href} asChild>
      <TouchableHighlight>
        <View
          style={{ backgroundColor: theme.colors.card }}
          className="flex-row items-center px-4 py-3"
        >
          <Image
            source={{ uri: feed.avatar }}
            alt={feed.displayName}
            className="h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500"
          />
          <View className="mx-3 flex-1 flex-row items-center">
            <Text className="text-base dark:text-white" numberOfLines={1}>
              {feed.displayName}
            </Text>
            {children}
          </View>
          <ChevronRight
            size={20}
            className="text-neutral-400 dark:text-neutral-200"
          />
        </View>
      </TouchableHighlight>
    </Link>
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
  const href = `/profile/${feed.creator.did}/generator/${feed.uri
    .split("/")
    .pop()}`;

  const { showActionSheetWithOptions } = useActionSheet();

  const editingValue = useSharedValue(editing ? 1 : 0);

  useEffect(() => {
    editingValue.value = editing ? 1 : 0;
  }, [editing, editingValue]);

  const star = (
    <TouchableOpacity onPress={() => onPressStar()}>
      <Star
        size={20}
        className={
          feed.pinned
            ? "text-yellow-400 dark:text-yellow-500"
            : "text-neutral-200 dark:text-neutral-800"
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
          <View className="flex-row items-center bg-white px-4 py-3 dark:bg-black">
            <Animated.View
              style={leftContainerStyle}
              className="relative flex-1 flex-row items-center"
            >
              <Animated.View
                style={deleteStyle}
                className="absolute right-full"
              >
                <TouchableWithoutFeedback
                  onPress={() => {
                    showActionSheetWithOptions(
                      {
                        title: "Unsave this feed?",
                        options: ["Unsave", "Cancel"],
                        cancelButtonIndex: 1,
                        destructiveButtonIndex: 0,
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
                    <MinusCircle
                      size={24}
                      fill="red"
                      className="text-white dark:text-black"
                    />
                  </View>
                </TouchableWithoutFeedback>
              </Animated.View>
              <Image
                source={{ uri: feed.avatar }}
                alt={feed.displayName}
                className="h-6 w-6 shrink-0 items-center justify-center rounded bg-blue-500"
              />
              <View className="flex-1 px-3">
                <Text className="text-base dark:text-white">
                  {feed.displayName}
                </Text>
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
                >
                  <TouchableWithoutFeedback onPressIn={drag}>
                    <View className="ml-1 px-2 py-0.5">
                      <Equal size={20} className="text-black dark:text-white" />
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
