import { TouchableOpacity, View } from "react-native";
import { HoldItem } from "react-native-hold-menu";
import { Image } from "expo-image";
import { Link, useRouter } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";
import {
  Ban,
  Megaphone,
  MegaphoneOff,
  User2,
  UserCircle,
  UserMinus,
  UserPlus,
} from "lucide-react-native";

import { blockAccount, muteAccount } from "../lib/account-actions";
import { useAuthedAgent } from "../lib/agent";

interface Props {
  profile: AppBskyActorDefs.ProfileViewBasic;
}

export const PostAvatar = ({ profile }: Props) => {
  const agent = useAuthedAgent();
  const theme = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();

  const profileHref = `/profile/${profile.handle}`;

  const invalidateProfile = () => {
    void queryClient.invalidateQueries(["profile", profile.handle]);
    void queryClient.invalidateQueries(["profile", profile.did]);
  };

  const MenuItems = [
    {
      text: `@${profile.handle}`,
      isTitle: true,
    },
    {
      text: "View Profile",
      onPress: () => router.push(profileHref),
      icon: () => <UserCircle size={18} color={theme.colors.text} />,
    },
    profile.viewer?.following
      ? {
          text: `Unfollow`,
          onPress: async () => {
            await agent.deleteFollow(profile.viewer!.following!);
            invalidateProfile();
          },
          icon: () => <UserMinus size={18} color={theme.colors.text} />,
        }
      : {
          text: `Follow`,
          onPress: async () => {
            await agent.follow(profile.did);
            invalidateProfile();
          },
          icon: () => <UserPlus size={18} color={theme.colors.text} />,
        },
    profile.viewer?.muted
      ? {
          text: `Unmute`,
          onPress: async () => {
            await agent.unmute(profile.did);
            invalidateProfile();
          },
          icon: () => <Megaphone size={18} color={theme.colors.text} />,
        }
      : {
          text: `Mute`,
          onPress: () => muteAccount(agent, profile.handle, profile.did),
          icon: () => <MegaphoneOff size={18} color={theme.colors.text} />,
        },
    {
      text: `Block`,
      onPress: () => blockAccount(agent, profile.handle, profile.did),
      icon: () => <Ban size={18} color={theme.colors.text} />,
    },
  ].filter(Boolean);

  return (
    <HoldItem items={MenuItems}>
      <Link href={profileHref} asChild>
        <TouchableOpacity>
          {profile.avatar ? (
            <Image
              recyclingKey={profile.did}
              source={{ uri: profile.avatar }}
              alt={`@${profile.handle}`}
              className="h-12 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800"
            />
          ) : (
            <View className="h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <User2 size={32} color={theme.colors.text} />
            </View>
          )}
        </TouchableOpacity>
      </Link>
    </HoldItem>
  );
};
