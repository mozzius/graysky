import Expo, { ExpoPushSuccessTicket } from "expo-server-sdk";
import { CronJob } from "cron";

import { Accounts } from "./accounts";
import { KVClient } from "./db";

export class PushNotifications {
  expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  incomingTickets: { ticket: ExpoPushSuccessTicket; token: string }[] = [];
  ticketsToBeChecked: { ticket: ExpoPushSuccessTicket; token: string }[] = [];
  key = "unsent-queue";

  constructor(
    public kv: KVClient,
    public accounts: Accounts,
  ) {
    const everyThirtySeconds = "*/30 * * * * *";
    new CronJob(everyThirtySeconds, this.consumeQueue.bind(this)).start();
    const everyFifteenMinutes = "0 */15 * * * *";
    new CronJob(everyFifteenMinutes, this.checkTickets.bind(this)).start();
  }

  async queue(did: string, message: { title: string; body: string }) {
    this.kv.rPush(this.key, JSON.stringify({ did, message }));
  }

  async consumeQueue() {
    const len = await this.kv.lLen(this.key);
    if (len === 0) {
      console.log("Nothing to send");
      return;
    }

    console.log(`Sending ${len} messages`);

    const messages = await this.kv.lPopCount(this.key, len);

    if (!messages) return; // should never happen

    const chunks = this.expo.chunkPushNotifications(
      messages.flatMap((x) => {
        const { did, message } = JSON.parse(x) as {
          did: string;
          message: { title: string; body: string };
        };
        const tokens = this.accounts.getPushTokens(did);
        return tokens.map((token) => ({
          to: token,
          title: message.title,
          body: message.body,
        }));
      }),
    );

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i]!;
          const message = chunk[i]!;
          if (ticket.status === "error") {
            console.error(ticket.details, ticket.message);
          } else {
            this.incomingTickets.push({
              ticket: ticket,
              token: message.to as string,
            });
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }

  async checkTickets() {
    // ensure we're only checking tickets after 15 minutes
    // by batching them
    const tickets = this.ticketsToBeChecked;
    this.ticketsToBeChecked = this.incomingTickets;
    this.incomingTickets = [];

    if (tickets.length === 0) return;

    const chunks = this.expo.chunkPushNotificationReceiptIds(
      tickets.map((ticket) => ticket.ticket.id),
    );

    for (const chunk of chunks) {
      try {
        const receipts = Object.entries(
          await this.expo.getPushNotificationReceiptsAsync(chunk),
        );

        for (const [id, receipt] of receipts) {
          if (receipt.status === "ok") continue;

          console.error(receipt.details?.error, receipt.message);

          switch (receipt.details?.error) {
            case "InvalidCredentials":
            case "MessageTooBig":
            case "MessageRateExceeded":
              break;
            case "DeviceNotRegistered":
              // remove token
              for (const ticket of tickets) {
                if (ticket.ticket.id === id) {
                  this.accounts.disablePushToken(ticket.token);
                  break;
                }
              }
              break;
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  }
}
