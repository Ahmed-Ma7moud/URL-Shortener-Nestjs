import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';

@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  constructor() {}

  private getRetryAfterHeader(response: any): string | number | undefined {
    const headerNames = [
      'Retry-After',
      'Retry-After-short',
      'Retry-After-medium',
    ];

    for (const name of headerNames) {
      const value = response.getHeader(name);
      if (value !== undefined) return value;
    }

    return undefined;
  }

  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const lang = request.headers?.lang;
    const retryAfter = this.getRetryAfterHeader(response);

    response.status(429).json({
      code: 'RATE_LIMIT_EXCEEDED',
      message: "You have exceeded the rate limit. Please try again later.",
      retryAfter: retryAfter,
    });
  }
}
