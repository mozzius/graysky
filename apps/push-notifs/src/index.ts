import { Accounts } from "./accounts";
import { Cache } from "./cache";
import { getRedisClient } from "./db";
import { Firehose, type Notification } from "./firehose";
import { PushNotifications } from "./push-notifications";

const accounts = new Accounts();

// iife
const run = (fn: () => unknown) => fn();

run(async () => {
  const kv = await getRedisClient();

  const cache = new Cache(kv);
  const pushNotifications = new PushNotifications(kv, accounts);

  new Firehose(accounts, async (notification) => {
    const isBlocking = await cache.isBlocking(
      notification.subject,
      notification.creator,
    );

    if (isBlocking) {
      console.log(
        `Not sending notification to ${await cache.getProfile(
          notification.subject,
        )} because they are blocking ${await cache.getProfile(notification.creator)}`,
      );
      return;
    }

    const message = {
      title: "",
      body: "",
    };

    switch (notification.type) {
      case "like":
      case "repost":
      case "reply":
      case "quote":
      case "mention": {
        const [name, post] = await Promise.all([
          cache.getProfile(notification.creator),
          cache.getContextPost(notification.uri),
        ]);
        message.title = getTitle(name, notification.type);
        message.body = post;
        break;
      }
      case "follow": {
        const name = await cache.getProfile(notification.creator);
        message.title = getTitle(name, notification.type);
        break;
      }
    }

    await pushNotifications.queue(notification.subject, message);
  });
});

function getTitle(name: string, type: Notification["type"]) {
  switch (type) {
    case "like":
      return `${name} liked your post`;
    case "follow":
      return `${name} followed you`;
    case "repost":
      return `${name} reposted your post`;
    case "reply":
      return `${name} replied to your post`;
    case "quote":
      return `${name} quoted your post`;
    case "mention":
      return `${name} mentioned you`;
  }
}
