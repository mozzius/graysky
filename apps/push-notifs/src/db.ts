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

export const getRedisClient = async () => {
  return await createClient(options)
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();
};

export type KVClient = ReturnType<typeof createClient>;
