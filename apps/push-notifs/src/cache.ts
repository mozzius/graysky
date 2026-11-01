import { Client, type AtUriString, type DidString } from "@atproto/lex";

import { type Redis } from "./db";
import { app } from "./lexicons";
import { getPds } from "./utils/pds";

export class Cache {
  client: Client;

  constructor(public kv: Redis) {
    this.client = new Client("https://public.api.bsky.app");
  }

  async getProfile(did: DidString) {
    const cached = await this.kv.client.get(`profile:${did}`);
    if (cached) return cached;

    const profile = await this.client.call(app.bsky.actor.getProfile, {
      actor: did,
    });

    const name = profile.displayName?.trim() || profile.handle;

    await this.kv.client.set(`profile:${did}`, name);

    // expire in one day
    await this.kv.client.expire(`profile:${did}`, 60 * 60 * 24);

    return name;
  }

  async getContextPost(uri: AtUriString) {
    const cached = await this.kv.client.get(`post:${uri}`);
    if (cached) return cached;

    const { thread } = await this.client.call(app.bsky.feed.getPostThread, {
      uri,
      depth: 0,
      parentHeight: 0,
    });

    let content = "";

    if (app.bsky.feed.defs.threadViewPost.isTypeOf(thread)) {
      const post = thread.post;

      if (app.bsky.feed.post.$matches(post.record)) {
        content = post.record.text;
      }
    }

    await this.kv.client.set(`post:${uri}`, content);

    // expire in one week (probably will stop receiving notifications by then?)
    await this.kv.client.expire(`post:${uri}`, 60 * 60 * 24 * 7);

    return content;
  }

  async getContextFeed(uri: AtUriString) {
    const cached = await this.kv.client.get(`feed:${uri}`);
    if (cached) return cached;

    const generator = await this.client.call(app.bsky.feed.getFeedGenerator, {
      feed: uri,
    });

    const name = generator.view.displayName;

    await this.kv.client.set(`feed:${uri}`, name);

    // expire in one week - no particular reason beyond making sure it clears out eventually
    await this.kv.client.expire(`feed:${uri}`, 60 * 60 * 24 * 7);

    return name;
  }

  async isBlocking(did: DidString, target: DidString) {
    const hasCache = await this.kv.client.exists(`blocking:${did}`);
    if (hasCache)
      return await this.kv.client.sIsMember(`blocking:${did}`, target);

    const allBlocks: string[] = [];

    // appview doesn't have listRecords
    const pdsSpecificClient = new Client(await getPds(did));

    for await (const record of pdsSpecificClient.listAll(app.bsky.graph.block, {
      repo: did,
      limit: 100,
    })) {
      if (record.valid) allBlocks.push(record.value.subject);
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
