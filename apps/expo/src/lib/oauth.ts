import {
  OAuthCallbackError,
  TokenInvalidError,
  TokenRefreshError,
  TokenRevokedError,
  ExpoOAuthClient as UntypedExpoOAuthClient,
  type AtprotoDid,
  type ExpoOAuthClientInterface,
  type ExpoOAuthClientOptions,
} from "@atproto/oauth-client-expo";

import {
  buildOAuthClientMetadata,
  DEFAULT_OAUTH_CLIENT_ID,
} from "@graysky/api/src/oauth";

/**
 * the oauth client id (the url of the client metadata document). override with
 * `EXPO_PUBLIC_OAUTH_CLIENT_ID` to test against a preview deployment of the
 * website, e.g. `https://<preview>.vercel.app/oauth-client-metadata.json`.
 * the redirect scheme is derived from it, so the app needs a rebuild
 * (app.config.ts registers the scheme)
 */
export const OAUTH_CLIENT_ID =
  (process.env.EXPO_PUBLIC_OAUTH_CLIENT_ID as string | undefined) ||
  DEFAULT_OAUTH_CLIENT_ID;

// the published package is missing the .d.ts for `ExpoOAuthClient` (it's a
// hand written file in src that doesn't get copied to dist), so it comes
// through as `any`. this is the type that file declares
const ExpoOAuthClient = UntypedExpoOAuthClient as new (
  options: ExpoOAuthClientOptions,
) => ExpoOAuthClientInterface;

type SessionDeletedListener = (did: AtprotoDid, cause: unknown) => void;

const deletedListeners = new Set<SessionDeletedListener>();

/**
 * called when a stored oauth session is deleted, e.g. because its refresh
 * token was revoked or expired, or after signing out
 */
export function onOAuthSessionDeleted(listener: SessionDeletedListener) {
  deletedListeners.add(listener);
  return () => {
    deletedListeners.delete(listener);
  };
}

let client: ExpoOAuthClientInterface | null = null;

/**
 * the oauth client. created lazily so the polyfills it imports are loaded
 * before it's constructed. sessions are persisted by the client itself (in its
 * own mmkv instance), keyed by did
 */
export function getOAuthClient() {
  if (!client) {
    client = new ExpoOAuthClient({
      handleResolver: "https://bsky.social",
      clientMetadata: buildOAuthClientMetadata(OAUTH_CLIENT_ID),
      onSessionDeleted(did, cause) {
        for (const listener of deletedListeners) {
          try {
            listener(did, cause);
          } catch (err) {
            console.error("oauth session deleted listener failed", err);
          }
        }
      },
    });
  }
  return client;
}

/**
 * the stored session is gone for good (revoked, expired, or never existed),
 * so the account needs to sign in again. other errors (e.g. network errors)
 * might be temporary
 */
export function isSessionGoneError(err: unknown) {
  return (
    err instanceof TokenRefreshError ||
    err instanceof TokenRevokedError ||
    err instanceof TokenInvalidError
  );
}

/**
 * the user backed out of the browser sheet (`ExpoOAuthClient.signIn` throws
 * `Authentication cancelled: <WebBrowserResultType>`), or declined on the
 * authorization page
 */
export function isOAuthCancellation(err: unknown) {
  if (err instanceof OAuthCallbackError) {
    return err.params.get("error") === "access_denied";
  }
  return (
    err instanceof Error && err.message.startsWith("Authentication cancelled")
  );
}
