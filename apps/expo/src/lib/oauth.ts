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

type Fetch = NonNullable<ExpoOAuthClientOptions["fetch"]>;

/**
 * when the auth server answers `use_dpop_nonce`, `@atproto/oauth-client` is
 * meant to retry once with the new nonce. to spot that answer it peeks at the
 * json body by piping `response.body` into a new `Response`. but in RN, `fetch`
 * is expo's (which has a stream body) while `Response` is still RN's
 * whatwg-fetch one, which can't be built that way. the peek throws, the retry
 * is skipped and the request fails with the `use_dpop_nonce` error.
 *
 * so buffer those responses into a `Response` with no `body`, which the
 * library already handles (it reads them with `clone().json()`)
 */
const oauthFetch: Fetch = async (input, init) => {
  const response = await fetch(
    input instanceof Request ? input : String(input),
    init,
  );
  if (
    response.status !== 400 ||
    !response.headers.has("DPoP-Nonce") ||
    // the pds sends its nonce errors as a 401 header, not in the body, so
    // those requests are left alone
    getHeader(input, init, "Authorization")?.startsWith("DPoP ")
  ) {
    return response;
  }
  const headers = new Headers();
  response.headers.forEach((value, name) => headers.append(name, value));
  return new Response(await response.text(), {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

function getHeader(
  input: unknown,
  init: RequestInit | undefined,
  name: string,
) {
  if (init?.headers) return new Headers(init.headers).get(name);
  return input instanceof Request ? input.headers.get(name) : null;
}

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
      fetch: oauthFetch,
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
