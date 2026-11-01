import { type AtUriString, type DidString } from "@atproto/lex";
import { isCreate, JetstreamV1, type TypedEventV1For } from "@bsky/jetstream";

import { type Accounts } from "./accounts";
import { app } from "./lexicons";
import { getDidFromUri } from "./utils/uri";

export type Notification =
  | {
      type: "follow";
      creator: DidString;
      subject: DidString;
    }
  | {
      type: "reply" | "quote" | "mention";
      creator: DidString;
      subject: DidString;
      uri: AtUriString;
      text: string;
    }
  | {
      type: "like" | "repost";
      creator: DidString;
      subject: DidString;
      uri: AtUriString;
    };

// The public jetstream*.bsky.network hosts speak the v1 wire
const JETSTREAM_URL =
  process.env.JETSTREAM_URL ?? "https://jetstream2.us-east.bsky.network";

const RESTART_TIMEOUT = 1000;

const COLLECTIONS = [
  app.bsky.feed.post,
  app.bsky.feed.like,
  app.bsky.feed.repost,
  app.bsky.graph.follow,
] as const;

type JetstreamEvent = TypedEventV1For<typeof COLLECTIONS>;

export class Firehose {
  jetstream = new JetstreamV1(JETSTREAM_URL);

  constructor(
    public accounts: Accounts,
    public queueNotification: (notification: Notification) => unknown,
  ) {
    void this.run();
  }

  async run() {
    try {
      // Passing lexicons as the collection filter validates and types the
      // records for us. The stream reconnects on its own, so this loop only
      // ends on a fatal error.
      const stream = this.jetstream.live({
        collections: COLLECTIONS,
        onError: (err) => {
          console.error("Jetstream error", err);
        },
      });

      for await (const evt of stream) {
        this.handleEvent(evt);
      }
    } catch (err) {
      console.error("Jetstream closed", err);
    }

    setTimeout(() => {
      void this.run();
    }, RESTART_TIMEOUT);
  }

  handleEvent(evt: JetstreamEvent) {
    // Get the creator
    const creator = evt.did;

    if (isCreate(evt, app.bsky.graph.follow)) {
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
    } else if (isCreate(evt, app.bsky.feed.post)) {
      const record = evt.commit.record;

      // Create the post URI
      const postUri: AtUriString = `at://${creator}/${evt.commit.collection}/${evt.commit.rkey}`;

      // Check if the post is a reply or not
      if (record.reply != null) {
        // Get the DIDs from the root and parent URIs
        const rootSubject = getDidFromUri(record.reply.root.uri);
        const parentSubject = getDidFromUri(record.reply.parent.uri);

        if (
          rootSubject !== creator &&
          this.accounts.isRelevantAccount(rootSubject)
        ) {
          this.queueNotification({
            type: "reply",
            creator,
            subject: rootSubject,
            uri: postUri,
            text: record.text,
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
            text: record.text,
          });
        }
      } else if (record.embed != null) {
        if (app.bsky.embed.record.$isTypeOf(record.embed)) {
          const subject = getDidFromUri(record.embed.record.uri);
          if (subject === creator || !this.accounts.isRelevantAccount(subject))
            return;
          this.queueNotification({
            type: "quote",
            creator,
            subject,
            uri: postUri,
            text: record.text,
          });
        }
      } else if (record.facets != null) {
        // We need to store the subjects we have already notified
        const notified: DidString[] = [];

        // Loop through the available facets and the features of those facets
        for (const facet of record.facets) {
          for (const feature of facet.features) {
            //   If we find a mention...
            if (app.bsky.richtext.facet.mention.isTypeOf(feature)) {
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
                text: record.text,
                uri: postUri,
              });
              notified.push(subject);
            }
          }
        }
      }
    } else if (isCreate(evt, app.bsky.feed.like)) {
      const uri = evt.commit.record.subject.uri;
      const subject = getDidFromUri(uri);
      if (subject === creator || !this.accounts.isRelevantAccount(subject))
        return;
      this.queueNotification({
        type: "like",
        creator,
        subject,
        uri,
      });
    } else if (isCreate(evt, app.bsky.feed.repost)) {
      const uri = evt.commit.record.subject.uri;
      const subject = getDidFromUri(uri);
      if (subject === creator || !this.accounts.isRelevantAccount(subject))
        return;
      this.queueNotification({
        type: "repost",
        creator,
        subject,
        uri,
      });
    }
  }
}
