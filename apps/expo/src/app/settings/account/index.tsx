import { useQuery } from "@tanstack/react-query";
import {
  AtSignIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  UserX,
} from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useAgent } from "~/lib/agent";

export default function AccountSettings() {
  const agent = useAgent();
  // preload for other pages
  useSelf();

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          !!agent?.session?.email && {
            title: "Account Details",
            options: [
              {
                icon: MailIcon,
                title: agent.session.email,
              },
            ],
          },
          {
            title: "Profile Settings",
            options: [
              {
                title: "Edit Profile",
                href: "/edit-bio",
                icon: UserIcon,
              },
              {
                title: "Change Handle",
                href: "/settings/account/change-handle",
                icon: AtSignIcon,
              },
            ],
          },
          {
            title: "Advanced Settings",
            options: [
              {
                title: "Change Password",
                icon: LockIcon,
                href: "/settings/account/change-password",
              },
              {
                title: "Delete Account",
                icon: UserX,
                destructive: true,
                href: "/settings/account/delete-account",
              },
            ],
          },
        ]}
      />
    </TransparentHeaderUntilScrolled>
  );
}

export const useSelf = () => {
  const agent = useAgent();

  return useQuery({
    queryKey: ["self"],
    queryFn: async () => {
      if (!agent.session) throw new Error("Not logged in");
      const self = await agent.app.bsky.actor.getProfile({
        actor: agent.session.did,
      });
      if (!self.success) throw new Error("Could not fetch self");
      return self.data;
    },
  });
};
