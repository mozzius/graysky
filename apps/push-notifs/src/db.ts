import {
  createClient,
  type RedisClientOptions,
  type RedisFunctions,
  type RedisModules,
  type RedisScripts,
} from "redis";

let options: RedisClientOptions<RedisModules, RedisFunctions, RedisScripts>;

if (process.env.REDIS_URL) {
  options = {
    url: process.env.REDIS_URL,
  };
}

export class Redis {
  constructor(public client: KVClient) {}

  async connect() {
    this.client = createClient(options);
    this.client.on("error", (err) => {
      console.error("Redis error", err);
      this.connect();
    });
    await this.client.connect();
  }

  static async create() {
    const client = createClient(options);
    const instance = new Redis(client);
    client.on("error", (err) => {
      console.error("Redis error", err);
      instance.connect();
    });
    await client.connect();
    return instance;
  }
}

export type KVClient = ReturnType<typeof createClient>;
