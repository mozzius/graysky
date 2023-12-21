import { NextResponse } from "next/server";

const SERVICE_DID = "did:web:graysky.app";

export function GET() {
  return NextResponse.json({
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: SERVICE_DID,
    verificationMethod: [
      {
        id: `${SERVICE_DID}#atproto`,
        type: "Multikey",
        controller: SERVICE_DID,
        publicKeyMultibase: "zQ3shS9xdF5BahagdsLPznAU9L3YrZ6qenrNaV2kq6RjvZ4d1",
      },
    ],
    service: [
      {
        id: "#bsky_notif",
        type: "BskyNotificationService",
        serviceEndpoint: "https://graysky.app",
      },
    ],
  });
}
