import { type NextRequest } from "next/server";
import { type AppBskyNotificationRegisterPush } from "@atproto/api";
import { DidResolver, MemoryCache } from "@atproto/identity";
import { AuthRequiredError, verifyJwt } from "@atproto/xrpc-server";

// import { db } from "@graysky/db";

const SERVICE_DID = "did:web:graysky.app";

const didCache = new MemoryCache();
const didResolver = new DidResolver({
  plcUrl: "https://plc.directory",
  didCache,
});

export async function POST(req: NextRequest) {
  try {
    const auth = req.headers.get("authorization");
    if (!auth || !auth.startsWith("Bearer "))
      throw new AuthRequiredError("authorization required");

    const token = auth.slice("Bearer ".length);

    const jwt = await verifyJwt(token, SERVICE_DID, async (did: string) =>
      didResolver.resolveAtprotoKey(did),
    );

    console.log(jwt);

    const body =
      (await req.json()) as AppBskyNotificationRegisterPush.InputSchema;

    console.log(body);

    // if (["ios", "android"].includes(body.platform)) {
    //   await db.pushToken.upsert({
    //     where: { AND: [{ did }, { platform: body.platform }] },
    //   });
    // }

    return new Response(null, { status: 200 });
  } catch (err) {
    return new Response(null, {
      status: err instanceof AuthRequiredError ? 401 : 500,
    });
  }
}
