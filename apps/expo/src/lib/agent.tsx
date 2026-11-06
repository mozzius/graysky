import { createContext, useContext } from "react";
import {
  Client,
  type Agent,
  type AgentOptions,
  type DidString,
  type HandleString,
} from "@atproto/lex";
import { api } from "@bsky/sdk";

/**
 * every client in the app should be created through this, so they share the
 * same options:
 *
 * - `strictResponseProcessing: false` - the network still has records with
 *   legacy blob refs, timezone-less datetimes etc. the old AtpAgent accepted
 *   these, so we need to as well or feeds start failing
 * - `appLabelers` - the old AtpAgent always sent the bluesky moderation service
 *   (with `;redact`) in the `atproto-accept-labelers` header, so we keep that
 */
export function createClient(agent: Agent | AgentOptions) {
  return new Client(agent, {
    strictResponseProcessing: false,
    appLabelers: [api.moderation.did],
  });
}

/**
 * the client for a signed in (oauth) session.
 *
 * the oauth scopes grant app.bsky.* calls for the bluesky appview only
 * (`aud=did:web:api.bsky.app#bsky_appview`), so we always proxy to it rather
 * than relying on the PDS's default appview matching.
 *
 * the PDS still handles the methods it implements itself (com.atproto.repo.*,
 * identity, registerPush etc) regardless of the proxy header. the exceptions
 * are `com.atproto.moderation.createReport`, which the PDS would otherwise
 * forward to the appview - pass `{ service: null }` so it goes to the PDS's
 * report service - and get/putPreferences, which a PDS forwards to the named
 * appview if it isn't its default. use `getPreferences` / `putPreferences`
 * from `~/lib/hooks/preferences`, which pass `{ service: null }`
 */
export function createAuthenticatedClient(agent: Agent) {
  return new Client(agent, {
    strictResponseProcessing: false,
    appLabelers: [api.moderation.did],
    service: api.app.service,
  });
}

/**
 * unauthenticated client pointed at the public appview. used when logged out
 */
export const publicClient = createClient(api.app.urlPublic);

// client context - provides the current client instance
const agentContext = createContext<Client>(publicClient);

export const AgentProvider = agentContext.Provider;

/**
 * the current lex `Client`. authenticated if logged in (`agent.did` is set),
 * otherwise the public appview client
 */
export const useAgent = () => {
  const agent = useContext(agentContext);
  return agent;
};

export const useOptionalAgent = () => {
  return useContext(agentContext);
};

/** what we know about the signed in account */
export interface SessionInfo {
  did: DidString;
  handle: HandleString;
  /** only available if the `account:email` scope was granted */
  email?: string;
  emailConfirmed?: boolean;
  /** the oauth authorization server, e.g. https://bsky.social */
  issuer: string;
}

// session context - the current session's account info
const sessionContext = createContext<SessionInfo | null>(null);

export const SessionProvider = sessionContext.Provider;

/**
 * the current session's account info, or null if logged out
 */
export const useSession = () => {
  return useContext(sessionContext);
};

// auth context - provides auth actions
export interface AuthContextValue {
  /**
   * start an oauth sign in. `input` is a handle, did, or PDS url (a PDS url
   * lets the user pick an account, or create one, on the PDS's page).
   * resolves to `false` if the user backed out. `create` asks the PDS to show
   * its sign up page
   */
  signIn: (input: string, options?: { create?: boolean }) => Promise<boolean>;
  /** switch to a saved account. throws if it needs to sign in again */
  switchAccount: (did: string) => Promise<void>;
  /** re-fetch the account info, e.g. after changing handle */
  refreshSession: () => Promise<void>;
  logout: () => void;
}

const authContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = authContext.Provider;

export const useAuth = () => {
  const auth = useContext(authContext);
  if (!auth) throw new Error("AuthContext not found");
  return auth;
};
