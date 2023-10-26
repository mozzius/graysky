import { NextResponse, type NextRequest } from "next/server";
import { messaging } from "firebase-admin";
import { applicationDefault, initializeApp } from "firebase-admin/app";

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

initializeApp({
  credential: applicationDefault(),
});

export async function POST(req: NextRequest) {
  const { notifications } = (await req.json()) as {
    notifications: PushNotification[];
  };

  console.log("NOTIFICATIONS", notifications);

  const ios = notifications.filter((n) => n.platform === 1);
  const android = notifications.filter((n) => n.platform === 2);

  await Promise.all([
    sendAndroidNotifications(android),
    sendIosNotifications(ios),
  ]);
}

async function sendAndroidNotifications(notifications: PushNotification[]) {
  const messages = notifications.map(
    (n) =>
      ({
        data: n.data,
        notification: {
          title: n.title,
          body: n.message,
        },
        tokens: n.tokens,
      }) satisfies messaging.Message,
  );

  const response = await messaging().sendEach(messages);

  console.log("ANDROID RESPONSE", response);
}
