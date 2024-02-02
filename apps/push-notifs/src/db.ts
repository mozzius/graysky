import { createClient } from "redis";

export const getRedisClient = async () => {
  return await createClient()
    .on("error", (err) => console.log("Redis Client Error", err))
    .connect();
};

export type KVClient = ReturnType<typeof createClient>;
