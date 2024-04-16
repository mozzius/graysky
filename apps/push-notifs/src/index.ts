import { AppBskyGraphDefs } from "@atproto/api";
import { CronJob } from "cron";

import { Accounts } from "./accounts";
import { Cache } from "./cache";
import { getRedisClient } from "./db";
import { Firehose, type Notification } from "./firehose";
import { PushNotifications } from "./push-notifications";
import { RateLimiter } from "./rate-limiter";

// 10 notifications every 30 minutes
const RATE_LIMIT = 10;
const RATE_LIMIT_DURATION = 30;

const accounts = new Accounts();

// kill process every day
new CronJob("0 0 * * *", () => process.exit(0)).start();

// iife
const run = (fn: () => unknown) => fn();

run(async () => {
  const kv = await getRedisClient();

  const cache = new Cache(kv);
  const pushNotifications = new PushNotifications(kv, accounts);
  const rateLimiter = new RateLimiter(kv, RATE_LIMIT, RATE_LIMIT_DURATION);

  console.log("Starting push notifications service");

  new Firehose(accounts, async (notification) => {
    try {
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

      const { exceeded } = await rateLimiter.checkRateLimit(
        notification.subject,
      );
      if (exceeded) {
        return;
      }

      const message = {
        title: "",
        body: "",
        data: { path: "/notifications" },
      };

      switch (notification.type) {
        case "like":
        case "repost":
        case "reply":
        case "quote":
        case "mention": {
          const [did, slug, rkey] = notification.uri.split("/").slice(2);
          const [name, post] = await Promise.all([
            cache.getProfile(notification.creator),
            slug === "app.bsky.feed.post"
              ? cache.getContextPost(notification.uri)
              : cache.getContextFeed(notification.uri),
          ]);

          message.title = getTitle(name, notification);
          message.body = post;
          if (slug === "app.bsky.feed.post") {
            message.data.path = `/profile/${did}/post/${rkey}`;
          } else if (slug === "app.bsky.feed.generator") {
            message.data.path = `/profile/${did}/feed/${rkey}`;
          }
          break;
        }
        case "follow": {
          const name = await cache.getProfile(notification.creator);
          message.title = "New follower!";
          message.body = getTitle(name, notification);
          message.data.path = `/profile/${notification.creator}`;

          try {
            // "followed you back" message
            // don't bother caching because it's very unlikely
            // we'd check the same relationship twice
            const relationship =
              await cache.agent.app.bsky.graph.getRelationships({
                actor: notification.subject,
                others: [notification.creator],
              });
            if (
              AppBskyGraphDefs.isRelationship(
                relationship.data.relationships[0],
              )
            ) {
              if (relationship.data.relationships[0].following) {
                message.body = `${name} followed you back`;
              }
            }
          } catch (err) {
            console.error("Error getting relationship", err);
          }
          break;
        }
      }

      await pushNotifications.queue(notification.subject, message);
    } catch (err) {
      console.error("Error processing notification", err);
    }
  });
});

function getTitle(name: string, notification: Notification) {
  switch (notification.type) {
    case "like":
      return `${name} liked your ${
        notification.uri.includes("app.bsky.feed.post") ? "post" : "feed"
      }`;
    case "follow":
      return `${name} started following you`;
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
