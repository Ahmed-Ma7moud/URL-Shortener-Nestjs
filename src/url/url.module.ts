import { Module } from '@nestjs/common';
import { UrlService } from './url.service';
import { UrlController } from './url.controller';
import { RedirectController } from './redirect.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UrlEntity } from './entities/url.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UrlEntity])],
  controllers: [UrlController, RedirectController],
  providers: [UrlService],
})
export class UrlModule {}