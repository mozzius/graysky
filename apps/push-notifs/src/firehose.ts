import {
  AppBskyEmbedRecord,
  AppBskyRichtextFacet,
  type AppBskyFeedDefs,
} from "@atproto/api";
import { CommitCreateEvent, Jetstream } from "@skyware/jetstream";

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
  firehose?: Jetstream;
  reconnectTimeout = 1000;

  constructor(
    public accounts: Accounts,
    public queueNotification: (notification: Notification) => unknown,
  ) {
    this.connect();
  }

  connect() {
    this.firehose = new Jetstream({
      endpoint: "wss://jetstream2.us-east.bsky.network/subscribe",
      wantedCollections: [
        "app.bsky.graph.follow",
        "app.bsky.feed.post",
        "app.bsky.feed.like",
        "app.bsky.feed.repost",
      ],
    });

    this.firehose.on("error", (error) => console.log(error));

    this.firehose.onCreate(
      "app.bsky.graph.follow",
      this.handleFollow.bind(this),
    );

    this.firehose.onCreate("app.bsky.feed.post", this.handlePost.bind(this));

    this.firehose.onCreate("app.bsky.feed.like", this.handleLike.bind(this));

    this.firehose.onCreate(
      "app.bsky.feed.repost",
      this.handleRepost.bind(this),
    );
  }

  handleFollow(evt: CommitCreateEvent<"app.bsky.graph.follow">) {
    const creator = evt.did;
    // See if the target is subscribed
    const subject = evt.commit.record.subject;

    // If the subject is the creator or we don't have the subject subscribed, return
    if (subject === creator || !this.accounts.isRelevantAccount(subject))
      return;

    // Send the notification
    this.queueNotification({
      type: "follow",
      creator,
      subject,
    });
  }

  handlePost(evt: CommitCreateEvent<"app.bsky.feed.post">) {
    const creator = evt.did;
    // Create the post URI
    const postUri = `at://${creator}/${evt.commit.collection}/${evt.commit.rkey}`;

    // Check if the post is a reply or not
    if (evt.commit.record.reply != null) {
      // Get both the root and the parent URIs
      const rootUri = (evt.commit.record?.reply as AppBskyFeedDefs.ReplyRef)
        ?.root.uri as string | undefined;
      const parentUri = (evt.commit.record?.reply as AppBskyFeedDefs.ReplyRef)
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
          text: evt.commit.record.text ?? "",
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
          text: evt.commit.record.text ?? "",
        });
      }
    } else if (evt.commit.record.embed != null) {
      if (AppBskyEmbedRecord.isMain(evt.commit.record.embed)) {
        const subject = getDidFromUri(evt.commit.record.embed.record.uri);
        if (subject === creator || !this.accounts.isRelevantAccount(subject))
          return;
        this.queueNotification({
          type: "quote",
          creator,
          subject,
          uri: postUri,
          text: evt.commit.record.text ?? "",
        });
      }
    } else if (evt.commit.record.facets != null) {
      // We need to store the subjects we have already notified
      const notified: string[] = [];

      // Loop through the available facets and the features of those facets
      for (const facet of evt.commit.record.facets) {
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
              text: evt.commit.record.text ?? "",
              uri: postUri,
            });
            notified.push(subject);
          }
        }
      }
    }
  }

  handleLike(evt: CommitCreateEvent<"app.bsky.feed.like">) {
    const creator = evt.did;
    const subject = getDidFromUri(evt.commit.record.subject.uri);
    if (subject === creator || !this.accounts.isRelevantAccount(subject))
      return;
    this.queueNotification({
      type: "like",
      creator,
      subject,
      uri: evt.commit.record.subject.uri,
    });
  }

  handleRepost(evt: CommitCreateEvent<"app.bsky.feed.repost">) {
    const creator = evt.did;
    const subject = getDidFromUri(evt.commit.record.subject.uri);
    if (subject === creator || !this.accounts.isRelevantAccount(subject))
      return;
    this.queueNotification({
      type: "repost",
      creator,
      subject,
      uri: evt.commit.record.subject.uri,
    });
  }
}
