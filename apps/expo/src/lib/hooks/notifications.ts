import { useEffect } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as Sentry from "@sentry/react-native";
import { useQueryClient } from "@tanstack/react-query";

import { useOptionalAgent } from "../agent";

const SERVICE_DID = "did:web:graysky.app";

Notifications.setNotificationHandler({
  handleNotification: () =>
    Promise.resolve({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
});

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
          Sentry.captureException(
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
    //       Sentry.captureException(
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
  console.log("Push token:", token);
  return token;
}
