import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    RedisService,

    {
      provide: 'REDIS',
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redis = new Redis({
          host: config.get<string>('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          maxRetriesPerRequest: 1,
        });

        try {
          await redis.ping();

          console.log('Redis connected successfully');

          return redis;
        } catch (error) {
          console.error('Redis connection failed:', error);

          redis.disconnect();

          throw error;
        }
      },
    },
  ],

  exports: ['REDIS', RedisService],
})
export class RedisModule {}
