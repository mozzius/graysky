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
  // preload for other pages
  useSelf();

  return (
    <TransparentHeaderUntilScrolled>
      <GroupedList
        groups={[
          !!agent?.session?.email && {
            title: "アカウントの詳細",
            options: [
              {
                icon: MailIcon,
                title: agent.session.email,
              },
            ],
          },
          {
            title: "プロフィールの設定",
            options: [
              {
                title: "プロフィールを編集",
                href: "/edit-bio",
                icon: UserIcon,
              },
              {
                title: "ハンドルを変更",
                href: "/settings/account/change-handle",
                icon: AtSignIcon,
              },
            ],
          },
          {
            title: "高度な設定",
            options: [
              {
                title: "パスワードを変更",
                icon: LockIcon,
                href: "/settings/account/change-password",
              },
              {
                title: "アカウントを削除",
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
      if (!agent?.session) throw new Error("ログインしていません");
      const self = await agent.getProfile({
        actor: agent.session.did,
      });
      if (!self.success) throw new Error("自分のプロフィールを取得できませんでした");
      return self.data;
    },
  });
};
