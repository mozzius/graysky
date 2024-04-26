import { AppBskyFeedDefs, AppBskyFeedPost, BskyAgent } from "@atproto/api";

import { type Redis } from "./db";
import { getPds } from "./utils/pds";

export class Cache {
  agent: BskyAgent;

  constructor(public kv: Redis) {
    this.agent = new BskyAgent({ service: "https://public.api.bsky.app" });
  }

  async getProfile(did: string) {
    const cached = await this.kv.client.get(`profile:${did}`);
    if (cached) return cached;

    const profile = await this.agent.getProfile({
      actor: did,
    });

    if (!profile.success) throw new Error("Failed to get profile");

    const name = profile.data.displayName ?? profile.data.handle;

    await this.kv.client.set(`profile:${did}`, name);

    // expire in one day
    await this.kv.client.expire(`profile:${did}`, 60 * 60 * 24);

    return name;
  }

  async getContextPost(uri: string) {
    const cached = await this.kv.client.get(`post:${uri}`);
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

    await this.kv.client.set(`post:${uri}`, content);

    // expire in one week (probably will stop receiving notifications by then?)
    await this.kv.client.expire(`post:${uri}`, 60 * 60 * 24 * 7);

    return content;
  }

  async getContextFeed(uri: string) {
    const cached = await this.kv.client.get(`feed:${uri}`);
    if (cached) return cached;

    const generator = await this.agent.app.bsky.feed.getFeedGenerator({
      feed: uri,
    });

    if (!generator.success) throw new Error("Failed to get feed");

    const name = generator.data.view.displayName;

    await this.kv.client.set(`feed:${uri}`, name);

    // expire in one week - no particular reason beyond making sure it clears out eventually
    await this.kv.client.expire(`feed:${uri}`, 60 * 60 * 24 * 7);

    return name;
  }

  async isBlocking(did: string, target: string) {
    const hasCache = await this.kv.client.exists(`blocking:${did}`);
    if (hasCache)
      return await this.kv.client.sIsMember(`blocking:${did}`, target);

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

    await this.kv.client.sAdd(
      `blocking:${did}`,
      allBlocks.length > 0 ? allBlocks : ["EMPTY"],
    );

    // expire in one day
    await this.kv.client.expire(`blocking:${did}`, 60 * 60 * 24);

    return allBlocks.includes(target);
  }
}
