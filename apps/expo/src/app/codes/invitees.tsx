import { type ComAtprotoServerDefs } from "@atproto/api";
import { useQuery } from "@tanstack/react-query";

import { ProfileList } from "~/components/profile-list";
import { QueryWithoutData } from "~/components/query-without-data";
import { useAgent } from "~/lib/agent";
import { useInviteCodes } from "./_layout";

interface Props {
  people: ComAtprotoServerDefs.InviteCodeUse[];
}

const Invitees = ({ people }: Props) => {
  const agent = useAgent();

  const profiles = useQuery({
    queryKey: ["invitees", people],
    queryFn: async () => {
      // split into groups of 25
      const groups = people
        .sort(
          (a, b) => new Date(b.usedAt).getTime() - new Date(a.usedAt).getTime(),
        )
        .reduce<ComAtprotoServerDefs.InviteCodeUse[][]>(
          (acc, x) => {
            if (acc[acc.length - 1]!.length >= 25) {
              acc.push([]);
            }
            acc[acc.length - 1]!.push(x);
            return acc;
          },
          [[]],
        );
      const profiles = await Promise.all(
        groups.map(async (group) => {
          const res = await agent.app.bsky.actor.getProfiles({
            actors: group.map((x) => x.usedBy),
          });
          if (!res.success) throw new Error("プロフィールを取得できませんでした");
          return res.data;
        }),
      );

      return profiles.flatMap((x) => x.profiles);
    },
  });

  if (profiles.data) {
    return <ProfileList profiles={profiles.data} />;
  }

  return <QueryWithoutData query={profiles} />;
};

export default function InviteesScreen() {
  const codes = useInviteCodes();

  if (codes.data) {
    return <Invitees people={codes.data.used.flatMap((x) => x.uses)} />;
  }

  return <QueryWithoutData query={codes} />;
}
