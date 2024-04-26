import { type Redis } from "./db";

export class RateLimiter {
  constructor(
    public kv: Redis,
    public rateLimit: number,
    public rateLimitDuration: number,
  ) {}

  /**
   * Check if the rate limit has been exceeded for a given ID
   * @param token some sort of ID, probably a token
   * @returns Returns true if the rate limit has been exceeded
   */
  async checkRateLimit(token: string) {
    const key = `rate-limit:${token}`;
    const count = await this.kv.client.get(key);
    if (count === null) {
      await this.kv.client.set(key, "1", {
        EX: 60 * this.rateLimitDuration,
      });
      return { exceeded: false, count: 0 };
    }

    if (parseInt(count, 10) > this.rateLimit) {
      return { exceeded: true, count: parseInt(count, 10) };
    }

    await this.kv.client.incr(key);
    return { exceeded: false, count: parseInt(count, 10) + 1 };
  }
}
