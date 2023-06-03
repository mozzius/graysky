import {
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ShadowDecorator } from "react-native-draggable-flatlist";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { type AppBskyFeedDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { ChevronRight, Equal, Star } from "lucide-react-native";

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
          <View className="flex-1 flex-row items-center px-3">
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
}: {
  feed: AppBskyFeedDefs.GeneratorView & { pinned: boolean };
  onPressStar: () => void;
  drag?: () => void;
}) => {
  const href = `/profile/${feed.creator.did}/generator/${feed.uri
    .split("/")
    .pop()}`;
  return (
    <ShadowDecorator>
      <Link href={href} asChild>
        <TouchableHighlight>
          <View className="flex-row items-center bg-white px-4 py-3 dark:bg-black">
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
            <TouchableOpacity
              onPress={() => {
                void Haptics.selectionAsync();
                onPressStar();
              }}
            >
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
            {drag && (
              <TouchableWithoutFeedback onPressIn={drag}>
                <View className="px-2 py-0.5">
                  <Equal size={20} className="text-black dark:text-white" />
                </View>
              </TouchableWithoutFeedback>
            )}
          </View>
        </TouchableHighlight>
      </Link>
    </ShadowDecorator>
  );
};
