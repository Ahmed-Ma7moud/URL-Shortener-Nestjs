import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimiterGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {

    if (req.user?.id) {
      return `user:${req.user.id}`;
    }

    return req.ips?.length ? `ip:${req.ips[0]}` : `ip:${req.ip}`;
  }
}
