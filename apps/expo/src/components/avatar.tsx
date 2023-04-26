import { Image } from "react-native";
import { useQuery } from "@tanstack/react-query";

import { useAuthedAgent } from "../lib/agent";
import { cx } from "../lib/utils/cx";

interface Props {
  className?: string;
}

export const Avatar = ({ className }: Props) => {
  const agent = useAuthedAgent();

  const profile = useQuery({
    queryKey: ["profile", agent.session.did],
    queryFn: async () => {
      const profile = await agent.getProfile({
        actor: agent.session.did,
      });
      return profile.data;
    },
  });

  return (
    <Image
      source={{ uri: profile.data?.avatar }}
      className={cx(
        "h-12 w-12 rounded-full bg-neutral-200 object-cover",
        className,
      )}
    />
  );
};
