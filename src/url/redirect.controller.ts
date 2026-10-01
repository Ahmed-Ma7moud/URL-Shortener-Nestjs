import { Controller, Get, HttpStatus, Param, Res } from '@nestjs/common';
import { UrlService } from './url.service';
import { Public } from '../auth/decorators/public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller()
@Public()
@ApiTags('redirect')
export class RedirectController {
  constructor(private readonly urlService: UrlService) {}

  @Get(':shortCode')
  @ApiOperation({ summary: 'Redirect to the original URL' })
  @ApiResponse({ status: 302, description: 'Redirects to the original URL' })
  async redirect(@Param('shortCode') shortCode: string, @Res() res: any) {
    const { originalUrl } = await this.urlService.redirect(shortCode);
    return res.redirect(HttpStatus.FOUND, originalUrl);
  }
}
