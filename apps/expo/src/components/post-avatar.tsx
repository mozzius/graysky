import { TouchableOpacity } from "react-native";
import { Link } from "expo-router";
import { type app } from "@bsky/sdk/lexicons";

import { useAbsolutePath } from "~/lib/absolute-path-context";
import { Avatar } from "./avatar";

interface Props {
  profile:
    | app.bsky.actor.defs.ProfileViewBasic
    | app.bsky.actor.defs.ProfileView
    | app.bsky.actor.defs.ProfileViewDetailed;
  moderation: { blur: boolean };
  avatarSize?: "normal" | "reduced";
}

export const PostAvatar = ({
  profile,
  moderation,
  avatarSize = "normal",
}: Props) => {
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
          blur={moderation.blur}
        />
      </TouchableOpacity>
    </Link>
  );
};
