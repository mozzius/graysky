import {
  AppBskyEmbedRecord,
  AppBskyFeedLike,
  AppBskyFeedPost,
  AppBskyFeedRepost,
  AppBskyGraphFollow,
  AppBskyRichtextFacet,
  type AppBskyFeedDefs,
} from "@atproto/api";
import {
  ComAtprotoSyncSubscribeRepos,
  subscribeRepos,
  type SubscribeReposMessage,
  type XrpcEventStreamClient,
} from "atproto-firehose";

import { type Accounts } from "./accounts";
import { getDidFromUri } from "./utils/uri";

export type Notification =
  | {
      type: "follow";
      creator: string;
      subject: string;
    }
  | {
      type: "reply" | "quote" | "mention";
      creator: string;
      subject: string;
      uri: string;
      text: string;
    }
  | {
      type: "like" | "repost";
      creator: string;
      subject: string;
      uri: string;
    };

export class Firehose {
  firehose?: XrpcEventStreamClient;
  reconnectTimeout = 1000;

  constructor(
    public accounts: Accounts,
    public queueNotification: (notification: Notification) => unknown,
  ) {
    this.connect();
  }

  connect() {
    this.firehose = subscribeRepos("wss://bsky.network", {
      decodeRepoOps: true,
    });

    this.firehose.on("message", this.handleMessage.bind(this));

    this.firehose.on("error", (err) => {
      console.error("Firehose error", err);
    });

    this.firehose.on("close", () => {
      console.error("Firehose closed");

      setTimeout(() => {
        this.connect();
      }, this.reconnectTimeout);
    });
  }

  handleMessage(message: SubscribeReposMessage) {
    if (!ComAtprotoSyncSubscribeRepos.isCommit(message)) return;

    const op = message.ops[0];

    // Get the creator DID
    if (op?.payload == null || op?.action !== "create") return;

    // Get the creator
    const creator = message.repo;

    if (AppBskyGraphFollow.isRecord(op.payload)) {
      // See if the target is subscribed
      const subject = op.payload.subject;

      // If the subject is the creator or we don't have the subject subscribed, return
      if (subject === creator || !this.accounts.isRelevantAccount(subject))
        return;

      // Send the notification
      this.queueNotification({
        type: "follow",
        creator,
        subject,
      });
    } else if (AppBskyFeedPost.isRecord(op.payload)) {
      // Create the post URI
      const postUri = `at://${creator}/${op.path}`;

      // Check if the post is a reply or not
      if (op.payload.reply != null) {
        // Get both the root and the parent URIs
        const rootUri = (op.payload?.reply as AppBskyFeedDefs.ReplyRef)?.root
          .uri as string | undefined;
        const parentUri = (op.payload?.reply as AppBskyFeedDefs.ReplyRef)
          ?.parent.uri as string | undefined;

        // I'm pretty sure here these can't be null, but just to make TS happy
        if (rootUri == null || parentUri == null) return;

        //   // Get the DIDs from those URIs
        const rootSubject = getDidFromUri(rootUri);
        const parentSubject = getDidFromUri(parentUri);

        if (
          rootSubject !== creator &&
          this.accounts.isRelevantAccount(rootSubject)
        ) {
          this.queueNotification({
            type: "reply",
            creator,
            subject: rootSubject,
            uri: postUri,
            text: op.payload.text ?? "",
          });
        } else if (
          parentSubject !== creator &&
          this.accounts.isRelevantAccount(parentSubject)
        ) {
          this.queueNotification({
            type: "reply",
            creator,
            subject: parentSubject,
            uri: postUri,
            text: op.payload.text ?? "",
          });
        }
      } else if (op.payload.embed != null) {
        if (AppBskyEmbedRecord.isMain(op.payload.embed)) {
          const subject = getDidFromUri(op.payload.embed.record.uri);
          if (subject === creator || !this.accounts.isRelevantAccount(subject))
            return;
          this.queueNotification({
            type: "quote",
            creator,
            subject,
            uri: postUri,
            text: op.payload.text ?? "",
          });
        }
      } else if (op.payload.facets != null) {
        // We need to store the subjects we have already notified
        const notified: string[] = [];

        // Loop through the available facets and the features of those facets
        for (const facet of op.payload.facets) {
          for (const feature of facet.features) {
            //   If we find a mention...
            if (AppBskyRichtextFacet.isMention(feature)) {
              const subject = feature.did;
              // Check if the creator is subscribed. If not, we will move on to the next one.
              // Also, if we have already notified this subject, continue. In case two different users are mentioned in the same post.
              if (
                subject === creator ||
                !this.accounts.isRelevantAccount(subject) ||
                notified.includes(subject)
              )
                continue;
              // Add the notification
              this.queueNotification({
                type: "mention",
                creator,
                subject,
                text: op.payload.text ?? "",
                uri: postUri,
              });
              notified.push(subject);
            }
          }
        }
      }
    } else if (AppBskyFeedLike.isRecord(op.payload)) {
      const subject = getDidFromUri(op.payload.subject.uri);
      if (subject === creator || !this.accounts.isRelevantAccount(subject))
        return;
      this.queueNotification({
        type: "like",
        creator,
        subject,
        uri: op.payload.subject.uri,
      });
    } else if (AppBskyFeedRepost.isRecord(op.payload)) {
      const subject = getDidFromUri(op.payload.subject.uri);
      if (subject === creator || !this.accounts.isRelevantAccount(subject))
        return;
      this.queueNotification({
        type: "repost",
        creator,
        subject,
        uri: op.payload.subject.uri,
      });
    }
  }
}
