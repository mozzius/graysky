import { Client } from "@atproto/lex";
import { api } from "@bsky/sdk";

/**
 * unauthenticated client for the public appview. lenient response processing
 * so that legacy records on the network don't break the page
 *
 * @param init extra fetch options for every request, e.g. next's `cache`
 */
export const createPublicClient = (init?: RequestInit) =>
  new Client(
    {
      service: api.app.urlPublic,
      fetch: init
        ? (input, reqInit) => fetch(input, { ...reqInit, ...init })
        : undefined,
    },
    { strictResponseProcessing: false },
  );
