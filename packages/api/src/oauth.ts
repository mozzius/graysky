/**
 * atproto oauth client metadata for the graysky app. shared between the app
 * (which passes it to the oauth client) and the website (which serves it at
 * the `client_id` url), so they can't drift apart.
 *
 * keep this file free of imports - the app bundles it directly
 */

export const DEFAULT_OAUTH_CLIENT_ID =
  "https://graysky.app/oauth-client-metadata.json";

/**
 * granular permissions, rather than `transition:generic`. if you add an rpc
 * call or record type that isn't covered here, it will fail with a scope error
 *
 * - `atproto`: required for all atproto oauth sessions
 * - `include:app.bsky.authFullApp`: everything the bluesky app needs (app.bsky
 *   rpc calls proxied to the bluesky appview, and app.bsky.* record writes)
 * - `blob:image/*`: uploading images (post images, avatars, banners, gif thumbs)
 * - `rpc:app.bsky.notification.registerPush`: registering push tokens with
 *   graysky's own notification service (did:web:graysky.app#bsky_notif)
 * - `rpc:com.atproto.moderation.createReport`: reports. the PDS routes these to
 *   its configured report service, so the audience isn't known ahead of time
 * - `rpc:app.bsky.actor.getPreferences` / `putPreferences`: preferences live
 *   on the PDS, so we call these without a proxy header. the PDS then checks
 *   the scope against its *own* default appview (e.g. blacksky's), which the
 *   include above doesn't cover, hence `aud=*`. sending the bsky.app header
 *   instead isn't an option - a PDS whose default appview isn't bluesky's
 *   would forward the call to bluesky's appview
 * - `account:email`: reading the account's email, shown in account settings
 * - `identity:handle`: changing handle
 */
export const OAUTH_SCOPE = [
  "atproto",
  "include:app.bsky.authFullApp?aud=did:web:api.bsky.app%23bsky_appview",
  "rpc:app.bsky.actor.getPreferences?aud=*",
  "rpc:app.bsky.actor.putPreferences?aud=*",
  "blob:image/*",
  "rpc:app.bsky.notification.registerPush?aud=did:web:graysky.app%23bsky_notif",
  "rpc:com.atproto.moderation.createReport?aud=*",
  "account:email",
  "identity:handle",
].join(" ");

/**
 * native apps must use a custom scheme that is the reverse of the client_id's
 * host, e.g. `graysky.app` -> `app.graysky`
 */
export function getOAuthRedirectScheme(clientId: string) {
  return new URL(clientId).hostname.split(".").reverse().join(".");
}

/** note: exactly one slash after the scheme */
export function getOAuthRedirectUri(clientId: string) {
  return `${getOAuthRedirectScheme(clientId)}:/auth/callback` as const;
}

export function buildOAuthClientMetadata(
  clientId: string = DEFAULT_OAUTH_CLIENT_ID,
) {
  const origin = new URL(clientId).origin;
  return {
    client_id: clientId,
    client_name: "Graysky",
    client_uri: origin,
    logo_uri: `${origin}/logo.png`,
    tos_uri: `${origin}/terms-and-conditions`,
    policy_uri: `${origin}/privacy-policy`,
    redirect_uris: [getOAuthRedirectUri(clientId)] as [`${string}:/${string}`],
    scope: OAUTH_SCOPE,
    grant_types: ["authorization_code", "refresh_token"] as [
      "authorization_code",
      "refresh_token",
    ],
    response_types: ["code"] as ["code"],
    application_type: "native" as const,
    token_endpoint_auth_method: "none" as const,
    dpop_bound_access_tokens: true,
  };
}
