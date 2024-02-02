import { CronJob } from "cron";

import { db } from "@graysky/db";

export interface Account {
  did: string;
  mutes: string[];
  muteLists: string[];
  tokens: {
    platform: string;
    token: string;
  }[];
}

export class Accounts {
  accounts = new Map<string, Account>();

  constructor() {
    void this.syncAccounts();
    const everyFiveMinutes = "0 */5 * * * *";

    new CronJob(everyFiveMinutes, this.syncAccounts.bind(this)).start();
  }

  isRelevantAccount(did: string) {
    return this.accounts.has(did);
  }

  getPushTokens(did: string) {
    const account = this.accounts.get(did);
    if (!account) return [];
    return account.tokens.map((token) => token.token);
  }

  async syncAccounts() {
    const accounts = await db.user.findMany({
      where: {
        tokens: {
          some: {
            disabled: false,
          },
        },
      },
      include: {
        tokens: {
          where: {
            disabled: {
              equals: false,
            },
          },
          select: {
            platform: true,
            token: true,
          },
        },
        mutes: {
          select: {
            did: true,
          },
        },
        muteLists: {
          select: {
            uri: true,
          },
        },
      },
    });
    this.accounts.clear();
    for (const account of accounts) {
      this.accounts.set(account.did, {
        did: account.did,
        mutes: account.mutes.map((mute) => mute.did),
        muteLists: account.muteLists.map((muteList) => muteList.uri),
        tokens: account.tokens,
      });
    }
  }

  async disablePushToken(token: string) {
    await db.pushToken.updateMany({
      where: { token },
      data: {
        disabled: true,
      },
    });
  }
}
