import { db } from "@graysky/db";

export class Accounts {
  accounts = new Map<
    string,
    {
      did: string;
      mutes: string[];
      muteLists: string[];
    }
  >();
  interval: NodeJS.Timeout;

  constructor() {
    // Sync accounts every 5 minutes
    void this.syncAccounts();

    this.interval = setInterval(
      () => {
        void this.syncAccounts();
      },
      1000 * 60 * 5,
    );
  }

  isRelevantAccount(did: string) {
    return this.accounts.has(did);
  }

  async syncAccounts() {
    console.log("Syncing accounts");
    const accounts = await db.user.findMany({
      where: {
        tokens: {
          some: {
            disabled: false,
          },
        },
      },
      include: {
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
      console.log(account.did);
      this.accounts.set(account.did, {
        did: account.did,
        mutes: account.mutes.map((mute) => mute.did),
        muteLists: account.muteLists.map((muteList) => muteList.uri),
      });
    }
  }
}
