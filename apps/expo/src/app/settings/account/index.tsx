import { app } from "@bsky/sdk/lexicons";
import { msg } from "@lingui/core/macro";
import { useLingui } from "@lingui/react";
import { useQuery } from "@tanstack/react-query";

import { Form } from "~/components/form";
import { TransparentHeaderUntilScrolled } from "~/components/transparent-header";
import { useOptionalAgent, useSession, type SessionInfo } from "~/lib/agent";
import { useLinkPress } from "~/lib/hooks/link-press";

/**
 * password, email and account deletion aren't available to oauth apps, so
 * send people to their account provider for those. the issuer is the account
 * host they signed in with (bsky.social for bluesky-hosted accounts, otherwise
 * their pds), which serves the account page at /account
 */
function getAccountManagementUrl(session: SessionInfo) {
  return new URL("/account", session.issuer).toString();
}

export default function AccountSettings() {
  const session = useSession();
  const { _ } = useLingui();
  const { openLink } = useLinkPress();

  // preload for other pages
  useSelf();

  return (
    <TransparentHeaderUntilScrolled>
      <Form
        sections={[
          !!session?.email && {
            title: _(msg`Account Details`),
            rows: [
              {
                icon: "mail",
                title: session.email,
              },
            ],
          },
          {
            title: _(msg`Profile Settings`),
            rows: [
              {
                title: _(msg`Edit Profile`),
                href: "/edit-bio",
                icon: "person",
              },
              {
                title: _(msg`Change Handle`),
                href: "/settings/account/change-handle",
                icon: "at",
              },
            ],
          },
          !!session && {
            title: _(msg`Account Management`),
            rows: [
              {
                title: _(msg`Manage Account`),
                onPress: () => openLink(getAccountManagementUrl(session)),
              },
            ],
            footer: _(
              msg`Your password, email address and account deletion are managed by your account provider.`,
            ),
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
      if (!agent?.did) throw new Error("Not logged in");
      return await agent.call(app.bsky.actor.getProfile, {
        actor: agent.did,
      });
    },
  });
};
