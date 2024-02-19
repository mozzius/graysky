import { msg } from "@lingui/macro";
import { useLingui } from "@lingui/react";
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
import { useAgent, useOptionalAgent } from "~/lib/agent";

export default function AccountSettings() {
  const agent = useAgent();
  const { _ } = useLingui();

  // preload for other pages
  useSelf();

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          !!agent?.session?.email && {
            title: _(msg`Account Details`),
            options: [
              {
                icon: MailIcon,
                title: agent.session.email,
              },
            ],
          },
          {
            title: _(msg`Profile Settings`),
            options: [
              {
                title: _(msg`Edit Profile`),
                href: "/edit-bio",
                icon: UserIcon,
              },
              {
                title: _(msg`Change Handle`),
                href: "/settings/account/change-handle",
                icon: AtSignIcon,
              },
            ],
          },
          {
            title: _(msg`Advanced Settings`),
            options: [
              {
                title: _(msg`Change Password`),
                icon: LockIcon,
                href: "/settings/account/change-password",
              },
              {
                title: _(msg`Delete Account`),
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
  const agent = useOptionalAgent();

  return useQuery({
    queryKey: ["self"],
    queryFn: async () => {
      if (!agent?.session) throw new Error("Not logged in");
      const self = await agent.getProfile({
        actor: agent.session.did,
      });
      if (!self.success) throw new Error("Could not fetch own profile");
      return self.data;
    },
  });
};
