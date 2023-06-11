import { TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { UserCircle } from "lucide-react-native";

interface Props {
  profile: AppBskyActorDefs.ProfileViewBasic;
}

export const PostAvatar = ({ profile }: Props) => {
  // const agent = useAuthedAgent();
  const theme = useTheme();
  // const queryClient = useQueryClient();
  // const router = useRouter();

  const profileHref = `/profile/${profile.handle}`;

  // const invalidateProfile = () => {
  //   void queryClient.invalidateQueries(["profile", profile.handle]);
  //   void queryClient.invalidateQueries(["profile", profile.did]);
  // };

  // const MenuItems = [
  //   {
  //     text: `@${profile.handle}`,
  //     isTitle: true,
  //   },
  //   {
  //     text: "View Profile",
  //     onPress: () => router.push(profileHref),
  //     icon: () => <UserCircle size={18} color={theme.colors.text} />,
  //   },
  //   profile.viewer?.following
  //     ? {
  //         text: `Unfollow`,
  //         onPress: async () => {
  //           await agent.deleteFollow(profile.viewer!.following!);
  //           invalidateProfile();
  //         },
  //         icon: () => <UserMinus size={18} color={theme.colors.text} />,
  //       }
  //     : {
  //         text: `Follow`,
  //         onPress: async () => {
  //           await agent.follow(profile.did);
  //           invalidateProfile();
  //         },
  //         icon: () => <UserPlus size={18} color={theme.colors.text} />,
  //       },
  //   profile.viewer?.muted
  //     ? {
  //         text: `Unmute`,
  //         onPress: async () => {
  //           await agent.unmute(profile.did);
  //           invalidateProfile();
  //         },
  //         icon: () => <Megaphone size={18} color={theme.colors.text} />,
  //       }
  //     : {
  //         text: `Mute`,
  //         onPress: () =>
  //           muteAccount(agent, profile.handle, profile.did, queryClient),
  //         icon: () => <MegaphoneOff size={18} color={theme.colors.text} />,
  //       },
  //   {
  //     text: `Block`,
  //     onPress: () =>
  //       blockAccount(agent, profile.handle, profile.did, queryClient),
  //     icon: () => <Ban size={18} color={theme.colors.text} />,
  //   },
  // ].filter(Boolean);

  return (
    // <HoldItem items={MenuItems}>
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
            <UserCircle size={32} color={theme.colors.text} />
          </View>
        )}
      </TouchableOpacity>
    </Link>
    // </HoldItem>
  );
};
