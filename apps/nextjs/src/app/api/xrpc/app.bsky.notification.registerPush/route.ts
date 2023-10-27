import { type NextRequest } from "next/server";

export const runtime = "edge";

interface PushNotification {
  tokens: string[];
  platform: 1 | 2; // 1 = ios, 2 = android
  title: string;
  message: string;
  topic: string;
  data?: Record<string, string>;
  collapse_id?: string;
  collapse_key?: string;
}

export async function POST(req: NextRequest) {
  const { notifications } = (await req.json()) as {
    notifications: PushNotification[];
  };

  console.log("NOTIFICATIONS", notifications);
}
