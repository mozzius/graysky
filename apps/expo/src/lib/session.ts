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

/** the "sessions" key as stored, which might have legacy or broken entries */
function readSavedSessions(): Partial<LegacySavedSession>[] {
  const raw = store.getString("sessions");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as unknown[]).filter(
      (s): s is Partial<LegacySavedSession> => !!s && typeof s === "object",
    );
  } catch {
    return [];
  }
}

export function getSavedSessions(): SavedSession[] {
  return cleanSavedSessions(readSavedSessions());
}

export function setSavedSessions(sessions: SavedSession[]) {
  store.set("sessions", JSON.stringify(cleanSavedSessions(sessions)));
}

/** remove an account from the account switcher */
export function removeSavedSession(did: string) {
  setSavedSessions(getSavedSessions().filter((s) => s.did !== did));
}

/**
 * write the cleaned up list back, so the account switcher (which reads the
 * key directly) doesn't show broken or duplicate entries. run on launch, after
 * `migrateLegacySessions`
 */
export function cleanUpSavedSessions() {
  const raw = store.getString("sessions");
  if (!raw) return;
  const cleaned = JSON.stringify(getSavedSessions());
  if (cleaned !== raw) store.set("sessions", cleaned);
}

function isDid(value: unknown): value is string {
  return typeof value === "string" && value.startsWith("did:");
}

/** how much we know about an account, to pick between duplicates */
function completeness(session: SavedSession) {
  return (
    (session.signedOut ? 0 : 4) +
    (session.avatar ? 2 : 0) +
    (session.displayName ? 1 : 0)
  );
}

/**
 * the list can have entries without a top level did (legacy entries might only
 * have it in `session.did`), and duplicates of the same account. those show up
 * as extra rows that never get replaced, since everything matches by did.
 *
 * - recover the did from `session.did`, and drop entries that still have none
 * - merge duplicates, keeping the most complete one in the first one's place
 * - drop the legacy token fields
 */
function cleanSavedSessions(
  sessions: readonly Partial<LegacySavedSession>[],
): SavedSession[] {
  const byDid = new Map<string, SavedSession>();
  for (const s of sessions) {
    const did = isDid(s.did)
      ? s.did
      : isDid(s.session?.did)
        ? s.session.did
        : null;
    if (!did) continue;
    const entry: SavedSession = {
      did,
      handle: s.handle || s.session?.handle || did,
      displayName: s.displayName,
      avatar: s.avatar,
      signedOut: s.signedOut,
    };
    const existing = byDid.get(did);
    if (!existing) {
      byDid.set(did, entry);
      continue;
    }
    const [best, other] =
      completeness(entry) > completeness(existing)
        ? [entry, existing]
        : [existing, entry];
    byDid.set(did, {
      ...best,
      displayName: best.displayName ?? other.displayName,
      avatar: best.avatar ?? other.avatar,
    });
  }
  return [...byDid.values()];
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
  did?: string;
  handle?: string;
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
  const saved = readSavedSessions();
  const hasLegacySaved = saved.some((s) => s.session || s.pdsUrl);

  if (!rawCurrent && !hasLegacySaved) return false;

  let current: { session: LegacySessionData; pdsUrl?: string } | null = null;
  if (rawCurrent) {
    try {
      const parsed = JSON.parse(rawCurrent) as LegacyStoredSession | null;
      if (parsed && typeof parsed === "object") {
        if (!("session" in parsed)) {
          current = { session: parsed };
        } else if (parsed.session && typeof parsed.session === "object") {
          current = parsed;
        }
      }
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

  // keep the accounts listed, minus the tokens. very old entries only have
  // the did inside `session`, and ones without a did at all get dropped by
  // `cleanSavedSessions`
  const stripped: Partial<LegacySavedSession>[] = saved.map((s) => ({
    ...s,
    did: s.did ?? s.session?.did,
    handle: s.handle ?? s.session?.handle,
    signedOut: true,
  }));
  const currentDid = current?.session.did;
  const currentHandle = current?.session.handle;
  if (isDid(currentDid) && !stripped.some((s) => s.did === currentDid)) {
    stripped.unshift({
      did: currentDid,
      handle: currentHandle ?? currentDid,
      signedOut: true,
    });
  }
  store.set("sessions", JSON.stringify(cleanSavedSessions(stripped)));
  store.remove("session");

  if (isDid(currentDid)) {
    store.set(REAUTH_DID_KEY, currentDid);
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
