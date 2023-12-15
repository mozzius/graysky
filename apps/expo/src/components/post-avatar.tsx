import { TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { type AppBskyActorDefs } from "@atproto/api";

import { useAbsolutePath } from "~/lib/absolute-path-context";
import { Avatar } from "./avatar";

interface Props {
  profile: AppBskyActorDefs.ProfileViewBasic;
  avatarSize?: "normal" | "reduced";
}

export const PostAvatar = ({ profile, avatarSize = "normal" }: Props) => {
  const path = useAbsolutePath();

  const profileHref = path(`/profile/${profile.did}`);

  return (
    <Link href={profileHref} asChild>
      <TouchableOpacity>
        <Avatar
          uri={profile.avatar}
          alt={`@${profile.handle}`}
          size={avatarSize === "normal" ? "large" : "medium"}
          className="shrink-0"
        />
      </TouchableOpacity>
    </Link>
  );
};
