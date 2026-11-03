import { type NextRequest } from "next/server";

import { buildOAuthClientMetadata } from "@graysky/api/src/oauth";

/**
 * atproto oauth client metadata. the `client_id` must be the exact url this is
 * served from, so it's derived from the request. in production that's
 * https://graysky.app/oauth-client-metadata.json, and preview deployments get
 * their own client id (set `EXPO_PUBLIC_OAUTH_CLIENT_ID` in the app to use one)
 */
export function GET(req: NextRequest) {
  const host = req.headers.get("x-forwarded-host") ?? req.nextUrl.host;
  const clientId = `https://${host}/oauth-client-metadata.json`;
  return Response.json(buildOAuthClientMetadata(clientId), {
    headers: {
      "Cache-Control": "public, max-age=600",
    },
  });
}
