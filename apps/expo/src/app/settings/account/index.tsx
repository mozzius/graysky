import { Text, View } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useQuery } from "@tanstack/react-query";
import { AtSign, Mail, User } from "lucide-react-native";

import { Avatar } from "../../../components/avatar";
import { GroupedList } from "../../../components/grouped-list";
import { useAgent } from "../../../lib/agent";

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

export default function AccountSettings() {
  const agent = useAgent();
  const theme = useTheme();

  const self = useSelf();

  return (
    <GroupedList
      groups={[
        {
          children: (
            <View className="flex-row items-center px-4 py-3">
              <Avatar size="large" />
              <View className="ml-4">
                <Text
                  style={{ color: theme.colors.text }}
                  className="text-base font-medium"
                >
                  {self.data?.displayName}
                </Text>
                <Text style={{ color: theme.colors.text }} className="text-sm">
                  @{self.data?.handle ?? agent?.session?.handle}
                </Text>
              </View>
            </View>
          ),
        },
        {
          options: [
            {
              title: "Edit Profile",
              href: "/settings/account/edit-bio",
              icon: User,
            },
            {
              title: "Change Handle",
              href: "/settings/account/change-handle",
              icon: AtSign,
            },
          ],
        },
        {
          options: [
            {
              icon: Mail,
              title:
                agent?.session?.email ??
                "Your email is hidden when logged in with an App Password",
            },
          ],
        },
      ]}
    />
  );
}
