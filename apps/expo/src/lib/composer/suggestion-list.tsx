import { TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { type AppBskyActorDefs } from "@atproto/api";
import { UserIcon } from "lucide-react-native";

import { Text } from "~/components/text";

interface Props {
  suggestions: AppBskyActorDefs.ProfileViewBasic[];
  onInsertHandle: (handle: string) => void;
}

export const SuggestionList = ({ suggestions, onInsertHandle }: Props) => {
  return (
    <Animated.View
      entering={FadeInDown}
      exiting={FadeOut}
      layout={LinearTransition}
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
