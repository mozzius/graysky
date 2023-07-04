import { TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";
import { useTheme } from "@react-navigation/native";
import { UserCircle } from "lucide-react-native";

import { cx } from "../lib/utils/cx";

interface Props {
  profile: AppBskyActorDefs.ProfileViewBasic;
}

export const PostAvatar = ({ profile }: Props) => {
  const theme = useTheme();

  const profileHref = `/profile/${profile.handle}`;

  return (
    <Link href={profileHref} asChild>
      <TouchableOpacity>
        {profile.avatar ? (
          <Image
            recyclingKey={profile.did}
            source={{ uri: profile.avatar }}
            alt={`@${profile.handle}`}
            className={cx(
              "h-12 w-12 rounded-full",
              theme.dark ? theme.colors.card : "bg-neutral-200",
            )}
          />
        ) : (
          <View
            className={cx(
              "h-12 w-12 items-center justify-center rounded-full",
              theme.dark ? theme.colors.card : "bg-neutral-200",
            )}
          >
            <UserCircle size={32} color={theme.colors.text} />
          </View>
        )}
      </TouchableOpacity>
    </Link>
  );
};
