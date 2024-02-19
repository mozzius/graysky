import { memo } from "react";
import { TouchableHighlight, View } from "react-native";
import { useRouter } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { TouchableHighlight as BottomSheetTouchableHighlight } from "@gorhom/bottom-sheet";
import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
import { useTheme } from "@react-navigation/native";
import { ChevronRightIcon, UserIcon, UsersIcon } from "lucide-react-native";

import { useAbsolutePath } from "~/lib/absolute-path-context";
import { Avatar } from "../avatar";
import { Text } from "../themed/text";

interface Props {
  person: AppBskyActorDefs.ProfileView;
  onPress?: (evt: { preventDefault: () => void }) => void;
  bottomSheet?: boolean;
  backgroundColor?: string;
}

const PersonRowUnmemoized = ({
  person,
  onPress,
  bottomSheet,
  backgroundColor,
}: Props) => {
  const router = useRouter();
  const theme = useTheme();
  const path = useAbsolutePath();
  const Touchable = bottomSheet
    ? BottomSheetTouchableHighlight
    : TouchableHighlight;
  const { _ } = useLingui();

  const { following, followedBy } = person.viewer ?? {};

  let text: string | null = null;
  let mutuals = false;

  if (following && followedBy) {
    mutuals = true;
    text = _(msg`Mutuals`);
  } else if (following) {
    text = _(msg`Following`);
  } else if (followedBy) {
    text = _(msg`Follows you`);
  }

  const Icon = mutuals ? UsersIcon : UserIcon;

  return (
    <Touchable
      onPress={() => {
        let preventDefault = false;
        const evt = { preventDefault: () => (preventDefault = true) };
        onPress?.(evt);
        if (!preventDefault) {
          router.push(path(`/profile/${person.did}`));
        }
      }}
    >
      <View
        style={{ backgroundColor: backgroundColor ?? theme.colors.card }}
        className="flex-row items-center px-4 py-2"
      >
        <View className="mr-3 h-10 w-10 rounded-full bg-neutral-200 dark:bg-neutral-800">
          <Avatar size="medium" uri={person.avatar} alt={person.displayName} />
        </View>
        <View className="flex-1">
          {person.displayName && (
            <Text className="text-base leading-5">{person.displayName}</Text>
          )}
          <View className="flex flex-row flex-wrap">
            <Text className="mr-1.5 text-sm text-neutral-500 dark:text-neutral-400">
              @{person.handle}
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
        <ChevronRightIcon size={20} className="ml-0.5 text-neutral-500" />
      </View>
    </Touchable>
  );
};

export const PersonRow = memo(PersonRowUnmemoized);
