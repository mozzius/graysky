import Expo, { type ExpoPushSuccessTicket } from "expo-server-sdk";
import { CronJob } from "cron";

import { type Accounts } from "./accounts";
import { type Redis } from "./db";

export class PushNotifications {
  expo = new Expo({ accessToken: process.env.EXPO_ACCESS_TOKEN });
  incomingTickets: { ticket: ExpoPushSuccessTicket; token: string }[] = [];
  ticketsToBeChecked: { ticket: ExpoPushSuccessTicket; token: string }[] = [];
  key = "unsent-queue";

  constructor(
    public kv: Redis,
    public accounts: Accounts,
  ) {
    const everyFiveSeconds = "*/5 * * * * *";
    new CronJob(everyFiveSeconds, this.consumeQueue.bind(this)).start();
    const everyFifteenMinutes = "0 */5 * * * *";
    new CronJob(everyFifteenMinutes, this.checkTickets.bind(this)).start();
  }

  async queue(did: string, message: { title: string; body: string }) {
    await this.kv.client.rPush(this.key, JSON.stringify({ did, message }));
  }

  async consumeQueue() {
    const len = await this.kv.client.lLen(this.key);
    if (len === 0) {
      return;
    }

    console.log(`Sending ${len} messages`);

    const messages = await this.kv.client.lPopCount(this.key, len);

    if (!messages) return; // should never happen

    const chunks = this.expo.chunkPushNotifications(
      messages.flatMap((x) => {
        const { did, message } = JSON.parse(x) as {
          did: string;
          message: {
            title: string;
            body: string;
            data?: Record<string, unknown>;
          };
        };
        const tokens = this.accounts.getPushTokens(did);
        return tokens.map((token) => ({
          to: token,
          title: message.title,
          body: message.body,
          data: message.data,
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
        console.log("Error sending messages");
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

    console.log(`Checking ${tickets.length} tickets`);

    const chunks = this.expo.chunkPushNotificationReceiptIds(
      tickets.map((ticket) => ticket.ticket.id),
    );

    let goodTickets = 0,
      badTickets = 0;

    for (const chunk of chunks) {
      try {
        const receipts = Object.entries(
          await this.expo.getPushNotificationReceiptsAsync(chunk),
        );

        for (const [id, receipt] of receipts) {
          if (receipt.status === "ok") {
            goodTickets++;
            continue;
          }

          badTickets++;

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
                  await this.accounts.disablePushToken(ticket.token);
                  break;
                }
              }
              break;
          }
        }
      } catch (error) {
        console.log("Error checking tickets");
        console.error(error);
      }
    }

    console.log(
      `Good tickets: ${goodTickets}, bad tickets: ${badTickets}, failure rate: ${(badTickets / (goodTickets + badTickets)) * 100}%`,
    );
  }
}
