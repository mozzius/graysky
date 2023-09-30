import {
  AtSignIcon,
  LockIcon,
  MailIcon,
  UserIcon,
  UserX,
} from "lucide-react-native";

import { GroupedList } from "~/components/grouped-list";
import { useAgent } from "~/lib/agent";

export default function AccountSettings() {
  const agent = useAgent();

  return (
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
              href: "/settings/account/edit-bio",
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
  );
}
