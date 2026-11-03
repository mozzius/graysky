import { createContext, useContext } from "react";
import { Client, type Agent, type AgentOptions } from "@atproto/lex";
import { type SessionData } from "@atproto/lex-password-session";
import { api } from "@bsky/sdk";

import { type StoredSessionData } from "./session";

/**
 * every client in the app should be created through this, so they share the
 * same options:
 *
 * - `strictResponseProcessing: false` - the network still has records with
 *   legacy blob refs, timezone-less datetimes etc. the old AtpAgent accepted
 *   these, so we need to as well or feeds start failing
 * - `appLabelers` - the old AtpAgent always sent the bluesky moderation service
 *   (with `;redact`) in the `atproto-accept-labelers` header, so we keep that
 *
 * note: no `service` (atproto-proxy) is set. the old agent didn't set one
 * either, so app.bsky.* calls go to the PDS, which proxies them to its
 * configured appview. this also means com.atproto.* and preferences calls hit
 * the PDS without needing `{ service: null }`
 */
export function createClient(agent: Agent | AgentOptions) {
  return new Client(agent, {
    strictResponseProcessing: false,
    appLabelers: [api.moderation.did],
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

// session context - the current session data (handle, email, tokens etc)
const sessionContext = createContext<SessionData | null>(null);

export const SessionProvider = sessionContext.Provider;

/**
 * the current session's data, or null if logged out. updates whenever the
 * session is refreshed
 */
export const useSession = () => {
  return useContext(sessionContext);
};

// auth context - provides auth actions
export interface AuthContextValue {
  login: (
    identifier: string,
    password: string,
    authFactorToken?: string,
  ) => Promise<void>;
  resumeSession: (
    session: StoredSessionData,
    pdsUrl?: string,
  ) => Promise<void>;
  /** force a token refresh, e.g. to pick up a new access token scope */
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
