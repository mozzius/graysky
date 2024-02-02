import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as Sentry from "@sentry/react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useOptionalAgent } from "../agent";
import {
  useEnableNotifications,
  useHasPromptedForNotifications,
} from "../storage/app-preferences";

const SERVICE_DID = "did:web:graysky.app";

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

export const useNotifications = () => {
  const agent = useOptionalAgent();
  const router = useRouter();
  const queryClient = useQueryClient();
  const notificationsEnabled = useEnableNotifications();
  const hasPrompted = useHasPromptedForNotifications();
  const hasPushed = useRef(false);

  useEffect(() => {
    if (!agent?.hasSession) return;

    if (!hasPrompted && !hasPushed.current) {
      hasPushed.current = true;
      setTimeout(() => router.push("/push-notifications"));
    }

    if (!notificationsEnabled) {
      return;
    }

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
          Sentry.captureException(
            new Error("Failed to register push token", { cause: error }),
          );
        }
      }
    })();
    // handle notifications that are received, both in the foreground or background
    Notifications.addNotificationReceivedListener((event) => {
      if (event.request.trigger.type === "push") {
        // refresh notifications in the background
        void queryClient.invalidateQueries({
          queryKey: ["notifications", "unread"],
        });
      }
    });
    // handle notifications that are tapped on
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        if (
          response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
        ) {
          // TODO: pass a deeplink in the notification to navigate to
          void queryClient.invalidateQueries({
            queryKey: ["notifications", "list"],
          });
          const notificationData = response.notification.request.content.data;
          if (typeof notificationData.path === "string") {
            router.push(notificationData.path);
          } else {
            router.push("/notifications");
          }
        }
      },
    );
    return () => {
      sub.remove();
    };
  }, [
    agent,
    agent?.hasSession,
    router,
    queryClient,
    notificationsEnabled,
    hasPrompted,
  ]);
};

export async function getPushToken() {
  // TODO: Un-hardcode the projectId
  // however expo-constants doesn't seem to work :/
  const token = await Notifications.getExpoPushTokenAsync({
    projectId:
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,
      (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
      "7e8ff69c-ba23-4bd8-98ce-7b61b05766c4",
  });
  console.log("Push token:", token);
  return token;
}
