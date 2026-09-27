import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import Redis from "ioredis";
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RedisModule } from "../redis/redis-config.module";

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: ["REDIS"],
      imports: [RedisModule],
      useFactory: (redis: Redis) => ({
        throttlers: [
          {
            name: "short",
            ttl: 60 * 1000,
            limit: 5,
          },
          {
            name: "medium",
            ttl: 60 * 60 * 1000,
            limit: 1000,
          },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimiterModule {}
