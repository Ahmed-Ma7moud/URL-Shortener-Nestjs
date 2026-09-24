import { Inject, Injectable } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
  constructor(
    @Inject("REDIS")
    private readonly redis: Redis,
  ) {}

  async get(key: string){
    const value = await this.redis.get(key);

    if (!value) {
      return null;
    }

    return JSON.parse(value);
  }

  async set(
    key: string,
    value: unknown,
    ttl?: number,
  ): Promise<void> {
    const serialized = JSON.stringify(value);

    if (ttl) {
      await this.redis.set(key, serialized, "EX", ttl);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async getRemainingTtl(key: string): Promise<number> {
    const ttl = await this.redis.ttl(key);
    return ttl > 0 ? ttl : 0;
  }
}