import { useMemo } from "react";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";

import { Form, type FormSections } from "~/components/form";
import { useAccountRows } from "~/components/switch-accounts";
import { useOptionalAgent } from "~/lib/agent";
import { useIsPro } from "~/lib/purchases";
import { useEnableNotifications } from "~/lib/storage/app-preferences";

export default function SettingsPage() {
  const agent = useOptionalAgent();
  const isPro = useIsPro();
  const enableNotifications = useEnableNotifications();
  const { _ } = useLingui();
  const accountRows = useAccountRows({
    active: agent?.did,
    showAddAccount: true,
  });

  const sections = useMemo<FormSections>(
    () => [
      {
        key: "accounts",
        rows: accountRows,
      },
      {
        rows: [
          {
            title: _(msg`Graysky Pro`),
            href: isPro ? "/settings/pro" : "/pro",
            icon: "star",
          },
        ],
      },
      {
        rows: [
          {
            title: _(msg`Account`),
            href: "/settings/account",
            icon: "person",
          },
          {
            title: _(msg`Moderation`),
            href: "/settings/moderation",
            icon: "shield",
          },
          {
            title: _(msg`Home feed preferences`),
            href: "/settings/feed",
            icon: "newspaper",
          },
          {
            title: _(msg`Languages`),
            href: "/settings/language",
            icon: "languages",
          },
          {
            title: _(msg`App settings`),
            href: "/settings/app",
            icon: "smartphone",
          },
        ],
      },
      !enableNotifications && {
        rows: [
          {
            title: _(msg`Push notifications`),
            href: "/push-notifications",
            icon: "bell",
          },
        ],
      },
      {
        rows: [
          {
            title: _(msg`About Graysky`),
            href: "/settings/about",
            icon: "at",
          },
        ],
      },
    ],
    [accountRows, isPro, enableNotifications, _],
  );

  return <Form sections={sections} />;
}
