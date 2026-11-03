import { type SessionData } from "@atproto/lex-password-session";

import { store } from "./storage/storage";

/**
 * the shape of `AtpSessionData` from `@atproto/api`, which is what older
 * versions of the app persisted. it's the same as `SessionData` minus
 * `service` (we stored the PDS url alongside it instead)
 */
export interface LegacySessionData {
  did: string;
  handle: string;
  accessJwt: string;
  refreshJwt: string;
  email?: string;
  emailConfirmed?: boolean;
  emailAuthFactor?: boolean;
  active?: boolean;
  status?: string;
}

/** either the new or legacy persisted session format */
export type StoredSessionData = SessionData | LegacySessionData;

/** what's stored under the "session" key */
export interface StoredSession {
  session: StoredSessionData;
  pdsUrl?: string;
}

/** an entry in the "sessions" key, used by the account switcher */
export interface SavedSession {
  displayName?: string;
  avatar?: string;
  handle: string;
  did: string;
  session: StoredSessionData;
  pdsUrl?: string;
  signedOut?: boolean;
}

export function isSessionData(
  session: StoredSessionData,
): session is SessionData {
  return "service" in session && typeof session.service === "string";
}

/**
 * convert a persisted session (old or new format) into the `SessionData` that
 * `PasswordSession` expects. legacy sessions get `service` from the PDS url
 * we stored next to them
 */
export function toSessionData(
  session: StoredSessionData,
  pdsUrl: string,
): SessionData {
  if (isSessionData(session)) return session;
  return {
    ...session,
    did: session.did as SessionData["did"],
    handle: session.handle as SessionData["handle"],
    active: session.active ?? true,
    service: pdsUrl,
  };
}

/** read the current session from storage, handling all the old formats */
export function getStoredSession(): StoredSession | null {
  const raw = store.getString("session");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StoredSession | StoredSessionData;
    // very old format: just the session data, without a pds url
    if ("did" in parsed && !("session" in parsed)) {
      return {
        session: parsed,
        pdsUrl: isSessionData(parsed) ? parsed.service : "https://bsky.social",
      };
    }
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

export function setStoredSession(session: SessionData) {
  const stored: StoredSession = { session, pdsUrl: session.service };
  store.set("session", JSON.stringify(stored));
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
