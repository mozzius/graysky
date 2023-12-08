import { TouchableOpacity, View } from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeOut,
  LinearTransition,
} from "react-native-reanimated";
import { Image } from "expo-image";
import { type AppBskyActorDefs } from "@atproto/api";
import { UserIcon, UsersIcon } from "lucide-react-native";

import { Text } from "~/components/themed/text";

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
      {suggestions
        .sort((a, b) => {
          const { following: aFollowing, followedBy: aFollowedBy } =
            a.viewer ?? {};
          const { following: bFollowing, followedBy: bFollowedBy } =
            b.viewer ?? {};
          const aScore = (aFollowing ? 2 : 0) + (aFollowedBy ? 1 : 0);
          const bScore = (bFollowing ? 2 : 0) + (bFollowedBy ? 1 : 0);
          return bScore - aScore;
        })
        .map((actor) => {
          const { following, followedBy } = actor.viewer ?? {};

          let text: string | null = null;
          let mutuals = false;

          if (following && followedBy) {
            mutuals = true;
            text = "Mutuals";
          } else if (following) {
            text = "Following";
          } else if (followedBy) {
            text = "Follows you";
          }

          const Icon = mutuals ? UsersIcon : UserIcon;

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
                    <Text
                      className="pr-1 text-base font-medium"
                      numberOfLines={1}
                    >
                      {actor.displayName}
                    </Text>
                  ) : (
                    <View className="h-2.5" />
                  )}
                  <View className="flex flex-row flex-wrap">
                    <Text className="mr-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                      @{actor.handle}
                    </Text>
                    {text && (
                      <View className="my-0.5 flex-row items-center rounded bg-neutral-100 pl-1 pr-1.5 dark:bg-neutral-800">
                        <Icon
                          size={12}
                          className="mr-0.5 mt-px text-neutral-500 dark:text-neutral-400"
                          strokeWidth={3}
                        />
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400">
                          {text}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
    </Animated.View>
  );
};
