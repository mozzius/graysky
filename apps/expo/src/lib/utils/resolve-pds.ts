import { type HandleString } from "@atproto/lex";
import { com } from "@bsky/sdk/lexicons";

import { publicClient } from "../agent";

interface DidDocument {
  service?: {
    id: string;
    type: string;
    serviceEndpoint: string;
  }[];
}

/**
 * Resolve a DID to find the PDS URL from the DID document.
 * Falls back to bsky.social if resolution fails.
 */
export async function resolvePdsFromDid(did: string): Promise<string> {
  try {
    // For did:plc, fetch the DID document from plc.directory
    if (did.startsWith("did:plc:")) {
      const res = await fetch(`https://plc.directory/${did}`);
      if (res.ok) {
        const didDoc = (await res.json()) as DidDocument;
        const pdsService = didDoc.service?.find(
          (s) =>
            s.id === "#atproto_pds" || s.type === "AtprotoPersonalDataServer",
        );
        if (pdsService?.serviceEndpoint) {
          return pdsService.serviceEndpoint;
        }
      }
    }

    // For did:web, fetch from the domain's .well-known
    if (did.startsWith("did:web:")) {
      const domain = did.replace("did:web:", "");
      const res = await fetch(`https://${domain}/.well-known/did.json`);
      if (res.ok) {
        const didDoc = (await res.json()) as DidDocument;
        const pdsService = didDoc.service?.find(
          (s) =>
            s.id === "#atproto_pds" || s.type === "AtprotoPersonalDataServer",
        );
        if (pdsService?.serviceEndpoint) {
          return pdsService.serviceEndpoint;
        }
      }
    }
  } catch {
    // Fall through to default
  }

  return "https://bsky.social";
}

/**
 * Resolve a handle or identifier to find the user's PDS URL.
 * Falls back to bsky.social if resolution fails.
 */
export async function resolvePdsUrl(identifier: string): Promise<string> {
  // If it's an email, we can't resolve - use default
  if (identifier.includes("@") && !identifier.includes(".")) {
    return "https://bsky.social";
  }

  const handle = identifier.startsWith("@") ? identifier.slice(1) : identifier;

  try {
    // Resolve handle to DID
    const resolution = await publicClient.call(
      com.atproto.identity.resolveHandle,
      { handle: handle as HandleString },
    );

    return resolvePdsFromDid(resolution.did);
  } catch {
    // Fall through to default
  }

  return "https://bsky.social";
}
