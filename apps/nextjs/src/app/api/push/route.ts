import { NextResponse, type NextRequest } from "next/server";
import { messaging } from "firebase-admin";
import { applicationDefault, initializeApp } from "firebase-admin/app";
import * as APN from "node-apn";

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

  const ios = notifications.filter((n) => n.platform === 1);
  const android = notifications.filter((n) => n.platform === 2);

  await Promise.all([
    sendAndroidNotifications(android),
    sendIosNotifications(ios),
  ]);
}

initializeApp({
  credential: applicationDefault(),
});

async function sendAndroidNotifications(notifications: PushNotification[]) {
  const messages = notifications
    .map(
      (n) =>
        ({
          data: n.data,
          notification: {
            title: n.title,
            body: n.message,
          },
          token: n.tokens[0]!,
        }) satisfies messaging.Message,
    )
    .filter((x) => Boolean(x.token));

  const response = await messaging().sendEach(messages);

  console.log("ANDROID RESPONSE", response);

  return response;
}

const apnProvider = new APN.Provider({});

async function sendIosNotifications(notifications: PushNotification[]) {
  const messages = notifications
    .map(
      (n) =>
        ({
          topic: n.topic,
          title: n.title,
          body: n.message,
          data: n.data,
          collapseId: n.collapse_id!,
          collapseKey: n.collapse_key,
          token: n.tokens[0]!,
        }) satisfies APN.Notification,
    )
    .filter((x) => Boolean(x.token));

  const response = await apnProvider.send(
    messages,
    notifications.map((n) => n.tokens[0]!),
  );

  console.log("IOS RESPONSE", response);

  return response;
}
