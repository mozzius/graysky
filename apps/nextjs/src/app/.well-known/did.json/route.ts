import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    "@context": ["https://www.w3.org/ns/did/v1"],
    id: "did:web:graysky.app",
    service: [
      {
        id: "#bsky_notif",
        type: "BskyNotificationService",
        serviceEndpoint: "https://graysky.app",
      },
    ],
  });
}
