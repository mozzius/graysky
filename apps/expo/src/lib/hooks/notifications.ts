/* eslint-disable @typescript-eslint/no-misused-promises */
import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as TaskManager from "expo-task-manager";
import { BskyAgent, type AtpSessionData } from "@atproto/api";
import { useQueryClient } from "@tanstack/react-query";
import * as Sentry from "sentry-expo";
import { z } from "zod";

import { useOptionalAgent } from "../agent";
import { store } from "../storage";

const SERVICE_DID = "did:web:graysky.app";

const BACKGROUND_NOTIFICATION_TASK = "BACKGROUND-NOTIFICATION-TASK";

const notificationSchema = z
  .object({
    subject: z.string(),
    content: z.object({
      title: z.string(),
      body: z.string(),
    }),
  })
  .array();

TaskManager.defineTask(
  BACKGROUND_NOTIFICATION_TASK,
  async ({ data, error }) => {
    console.log("Received a notification in the background!");

    if (error) {
      Sentry.Native.captureException(error);
      return;
    }

    // resume session
    const raw = store.getString("session");
    if (!raw) return;
    const session = JSON.parse(raw) as AtpSessionData;
    const agent = new BskyAgent({ service: "https://bsky.social" });
    await agent.resumeSession(session);
    if (!agent.hasSession) return;

    const notifications = notificationSchema.parse(data);
    const uniqueSubjects = Array.from(
      new Set<string>(notifications.map((notif) => notif.subject)),
    );
    // split into chunks of 25
    const chunks = [];
    for (let i = 0; i < uniqueSubjects.length; i += 25) {
      chunks.push(uniqueSubjects.slice(i, i + 25));
    }
    const chunkedProfiles = await Promise.all(
      chunks.map((chunk) =>
        agent.app.bsky.actor.getProfiles({ actors: chunk }),
      ),
    );
    const profiles = chunkedProfiles.flatMap((chunk) => chunk.data.profiles);
    for (const notification of notifications) {
      const profile = profiles.find(
        (profile) => profile.did === notification.subject,
      );
      if (
        !profile ||
        profile.viewer?.blockedBy ||
        profile.viewer?.blocking ||
        profile.viewer?.muted
      ) {
        continue;
      }

      void Notifications.scheduleNotificationAsync({
        content: notification.content,
        trigger: null,
      });
    }
  },
);

void Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

export function useNotifications() {
  const agent = useOptionalAgent();
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!agent?.hasSession) return;
    void (async () => {
      const perms = await Notifications.getPermissionsAsync();
      if (!perms.granted) {
        const requestedPerms = await Notifications.requestPermissionsAsync();
        if (!requestedPerms.granted) {
          return;
        }
      }

      // register the push token with the server
      const token = await getPushToken();
      if (token) {
        try {
          await agent.app.bsky.notification.registerPush({
            serviceDid: SERVICE_DID,
            platform: Platform.OS,
            token: token.data,
            appId: "dev.mozzius.graysky",
          });
        } catch (error) {
          Sentry.Native.captureException(
            new Error("Failed to register push token", { cause: error }),
          );
        }
      }
    })();
    // // listens for new changes to the push token
    // // In rare situations, a push token may be changed by the push notification service while the app is running. When a token is rolled, the old one becomes invalid and sending notifications to it will fail. A push token listener will let you handle this situation gracefully by registering the new token with your backend right away.
    // Notifications.addPushTokenListener(async ({ data: t, type }) => {
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //   console.log("Push token changed", { type, data: t });
    //   if (t) {
    //     try {
    //       await agent.api.app.bsky.notification.registerPush({
    //         serviceDid: SERVICE_DID,
    //         platform: Platform.OS,
    //         token: t as string,
    //         appId: "dev.mozzius.graysky",
    //       });
    //     } catch (error) {
    //       Sentry.Native.captureException(
    //         new Error("Failed to update push token", { cause: error }),
    //       );
    //     }
    //   }
    // });
    // handle notifications that are received, both in the foreground or background
    Notifications.addNotificationReceivedListener((event) => {
      if (event.request.trigger.type === "push") {
        // refresh notifications in the background
        void queryClient.invalidateQueries({
          queryKey: ["notifications", "unread"],
        });
        // TODO: handle payload-based deeplinks
        // let payload;
        // if (Platform.OS === 'ios') {
        //   payload = event.request.trigger.payload;
        // } else {
        //   // TODO: handle android payload deeplink
        // }
        // if (payload) {
        //   // TODO: deeplink notif here
        // }
      }
    });
    // handle notifications that are tapped on
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (
          response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
        ) {
          void queryClient.invalidateQueries({
            queryKey: ["notifications", "list"],
          });
          router.push("/notifications");
        }
      },
    );
    return () => {
      sub.remove();
    };
  }, [agent, agent?.hasSession, router, queryClient]);
}

export async function getPushToken() {
  const token = await Notifications.getExpoPushTokenAsync({
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment
    projectId: Constants.expoConfig?.extra?.eas.projectId,
  });
  console.log("Push token", token);
  return token;
}
