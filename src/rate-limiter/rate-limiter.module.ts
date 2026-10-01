import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import Redis from 'ioredis';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { RedisModule } from '../redis/redis-config.module';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: ['REDIS'],
      imports: [RedisModule],
      useFactory: (redis: Redis) => ({
        throttlers: [
          {
            name: 'short', // 1 minute
            ttl: 60 * 1000,
            limit: 50,
          },
          {
            name: 'medium', // 1 hour
            ttl: 60 * 60 * 1000,
            limit: 1000,
          },
          {
            name: 'long', // 1 day
            ttl: 24 * 60 * 60 * 1000,
            limit: 2000,
          },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimiterModule {}
