import { AppBskyFeedDefs, AppBskyFeedPost, BskyAgent } from "@atproto/api";

import { type KVClient } from "./db";
import { getPds } from "./utils/pds";

export class Cache {
  agent: BskyAgent;

  constructor(public kv: KVClient) {
    this.agent = new BskyAgent({ service: "https://api.bsky.app" });
  }

  async getProfile(did: string) {
    const cached = await this.kv.get(`profile:${did}`);
    if (cached) return cached;

    const profile = await this.agent.getProfile({
      actor: did,
    });

    if (!profile.success) throw new Error("Failed to get profile");

    const name = profile.data.displayName ?? profile.data.handle;

    await this.kv.set(`profile:${did}`, name);

    // expire in one day
    await this.kv.expire(`profile:${did}`, 60 * 60 * 24);

    return name;
  }

  async getContextPost(uri: string) {
    const cached = await this.kv.get(`post:${uri}`);
    if (cached) return cached;

    const thread = await this.agent.getPostThread({
      uri,
      depth: 0,
      parentHeight: 0,
    });

    if (!thread.success) throw new Error("Failed to get post");

    let content = "";

    if (AppBskyFeedDefs.isThreadViewPost(thread.data.thread)) {
      const post = thread.data.thread.post;

      if (AppBskyFeedPost.isRecord(post.record)) {
        content = post.record.text;
      }
    }

    await this.kv.set(`post:${uri}`, content);

    // expire in one week (probably will stop receiving notifications by then?)
    await this.kv.expire(`post:${uri}`, 60 * 60 * 24 * 7);

    return content;
  }

  async getContextFeed(uri: string) {
    const cached = await this.kv.get(`feed:${uri}`);
    if (cached) return cached;

    const generator = await this.agent.app.bsky.feed.getFeedGenerator({
      feed: uri,
    });

    if (!generator.success) throw new Error("Failed to get feed");

    const name = generator.data.view.displayName;

    await this.kv.set(`feed:${uri}`, name);

    // expire in one week - no particular reason beyond making sure it clears out eventually
    await this.kv.expire(`feed:${uri}`, 60 * 60 * 24 * 7);

    return name;
  }

  async isBlocking(did: string, target: string) {
    const hasCache = await this.kv.exists(`blocking:${did}`);
    if (hasCache) return await this.kv.sIsMember(`blocking:${did}`, target);

    const allBlocks: string[] = [];
    let cursor;

    // appview doesn't have listRecords
    const pdsSpecificAgent = new BskyAgent({
      service: await getPds(did),
    });

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const records = await pdsSpecificAgent.app.bsky.graph.block.list({
        repo: did,
        limit: 100,
        cursor,
      });
      allBlocks.push(...records.records.map((r) => r.value.subject));
      cursor = records.cursor;
      if (!cursor) break;
    }

    await this.kv.sAdd(`blocking:${did}`, allBlocks);

    // expire in one day
    await this.kv.expire(`blocking:${did}`, 60 * 60 * 24);

    return allBlocks.includes(target);
  }
}
