import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './data-source';
import { RedisModule } from './redis/redis-config.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { UserModule } from './user/user.module';
import { BlacklistGuard } from './auth/guards/blacklist.guard';
import { RateLimiterModule } from './rate-limiter/rate-limiter.module';
import { RateLimiterGuard } from './rate-limiter/guards/rate-limit.guard';
import { ThrottlerExceptionFilter } from './rate-limiter/filters/throttler-exception.filter';
import { UrlModule } from './url/url.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(AppDataSource.options),
    RedisModule,
    AuthModule,
    UserModule,
    UrlModule,
    RateLimiterModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RateLimiterGuard,
    },
    {
      provide: APP_GUARD,
      useClass: BlacklistGuard,
    },
    { provide: APP_FILTER, useClass: ThrottlerExceptionFilter },
  ],
})
export class AppModule {}
