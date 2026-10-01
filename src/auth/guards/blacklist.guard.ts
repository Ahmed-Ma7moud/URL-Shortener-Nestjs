import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

@Injectable()
export class BlacklistGuard implements CanActivate {
  constructor(private readonly redisService: RedisService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return true;
    }

    // Check Redis using the JTI extracted from the token
    const isBlacklisted = await this.redisService.get(`blacklist:${user.jti}`);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Check if the token's issued at time is before the revocation time
    const revocationTime = await this.redisService.get(`blacklist:${user.id}`); //sec
    if (revocationTime && Number(revocationTime) > Number(user.iat)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    // Check if the user's account has been deleted
    const isDeleted = await this.redisService.get(`deleted:${user.id}`);
    if (isDeleted) {
      throw new UnauthorizedException('User account has been deleted');
    }
    return true;
  }
}
