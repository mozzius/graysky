import { store } from "./storage/storage";

/**
 * an entry in the "sessions" key, used by the account switcher. the oauth
 * sessions themselves are stored by the oauth client, keyed by did
 */
export interface SavedSession {
  displayName?: string;
  avatar?: string;
  handle: string;
  did: string;
  /** needs to sign in again before it can be switched to */
  signedOut?: boolean;
}

/** the did of the account that's currently signed in */
const ACTIVE_DID_KEY = "active-did";

/** a did that needs the one-time "sign in again" screen */
const REAUTH_DID_KEY = "reauth-did";

export function getActiveDid() {
  return store.getString(ACTIVE_DID_KEY) ?? null;
}

export function setActiveDid(did: string | null) {
  if (did) {
    store.set(ACTIVE_DID_KEY, did);
  } else {
    store.remove(ACTIVE_DID_KEY);
  }
}

export function getSavedSessions(): SavedSession[] {
  const raw = store.getString("sessions");
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SavedSession[];
  } catch {
    return [];
  }
}

export function setSavedSessions(sessions: SavedSession[]) {
  store.set("sessions", JSON.stringify(sessions));
}

export function updateSavedSession(
  did: string,
  update: (session: SavedSession) => SavedSession,
) {
  setSavedSessions(
    getSavedSessions().map((s) => (s.did === did ? update(s) : s)),
  );
}

export function markSignedOut(did: string) {
  updateSavedSession(did, (s) => ({ ...s, signedOut: true }));
}

export function getReauthDid() {
  return store.getString(REAUTH_DID_KEY) ?? null;
}

export function clearReauthDid() {
  store.remove(REAUTH_DID_KEY);
}

// legacy password sessions

/**
 * a password session, as persisted by older versions of the app (both the
 * `@atproto/api` `AtpSessionData` and `@atproto/lex-password-session`
 * `SessionData` shapes)
 */
interface LegacySessionData {
  did: string;
  handle: string;
  accessJwt?: string;
  refreshJwt?: string;
  service?: string;
}

/** what older versions stored under the "session" key */
type LegacyStoredSession =
  { session: LegacySessionData; pdsUrl?: string } | LegacySessionData;

/** older entries in the "sessions" key also had the tokens */
type LegacySavedSession = SavedSession & {
  session?: LegacySessionData;
  pdsUrl?: string;
};

/**
 * the app used to sign in with passwords. those sessions can't be used any
 * more, so on the first launch after the update:
 *
 * - every saved account is kept in the account switcher, but marked as signed
 *   out, so it goes through oauth once
 * - the password tokens are revoked (best effort) and deleted from storage
 * - if someone was signed in, they get the "sign in again" screen
 *
 * @returns whether there was anything to migrate
 */
export function migrateLegacySessions(): boolean {
  const rawCurrent = store.getString("session");
  const saved = getSavedSessions() as LegacySavedSession[];
  const hasLegacySaved = saved.some((s) => s.session || s.pdsUrl);

  if (!rawCurrent && !hasLegacySaved) return false;

  let current: { session: LegacySessionData; pdsUrl?: string } | null = null;
  if (rawCurrent) {
    try {
      const parsed = JSON.parse(rawCurrent) as LegacyStoredSession;
      current = "session" in parsed ? parsed : { session: parsed };
    } catch {
      // corrupt - just drop it
    }
  }

  // revoke the old tokens, so they don't outlive the deleted copy
  const toRevoke = new Map<string, string>();
  for (const { session, pdsUrl } of [
    ...(current ? [current] : []),
    ...saved.flatMap((s) =>
      s.session ? [{ session: s.session, pdsUrl: s.pdsUrl }] : [],
    ),
  ]) {
    const service = pdsUrl ?? session.service;
    if (session.refreshJwt && service) {
      toRevoke.set(session.refreshJwt, service);
    }
  }
  for (const [refreshJwt, service] of toRevoke) {
    void revokeLegacySession(service, refreshJwt);
  }

  // keep the accounts listed, minus the tokens
  const stripped: SavedSession[] = saved.map((s) => ({
    did: s.did,
    handle: s.handle,
    displayName: s.displayName,
    avatar: s.avatar,
    signedOut: true,
  }));
  if (current && !stripped.some((s) => s.did === current.session.did)) {
    stripped.unshift({
      did: current.session.did,
      handle: current.session.handle,
      signedOut: true,
    });
  }
  setSavedSessions(stripped);
  store.remove("session");

  if (current) {
    store.set(REAUTH_DID_KEY, current.session.did);
  }

  return true;
}

async function revokeLegacySession(service: string, refreshJwt: string) {
  try {
    await fetch(new URL("/xrpc/com.atproto.server.deleteSession", service), {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshJwt}` },
    });
  } catch {
    // offline etc - the token will expire on its own
  }
}
