import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { UrlService } from './url.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
@Public()
export class RedirectController {
  constructor(private readonly urlService: UrlService) {}

  @Get(':shortCode')
  async redirect(@Param('shortCode') shortCode: string, @Res() res: any) {
    const { originalUrl } = await this.urlService.redirect(shortCode);
    return res.redirect(HttpStatus.FOUND, originalUrl);
  }
}
