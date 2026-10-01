import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { IAuthUser } from '../auth/interfaces/auth.interface';
import { AuthUser } from '../auth/decorators/user.decorator';
import { PaginationDto } from '../common/dto/pagination.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('api/urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @Throttle({
    short: { ttl: 60 * 1000, limit: 4 },
    medium: { ttl: 60 * 60 * 1000, limit: 10 },
    long: { ttl: 24 * 60 * 60 * 1000, limit: 15 },
  })
  async create(
    @Body() createUrlDto: CreateUrlDto,
    @AuthUser() user: IAuthUser,
  ) {
    return this.urlService.create(createUrlDto.originalUrl, user.id);
  }

  @Get()
  async findAll(@AuthUser() user: IAuthUser, @Query() query: PaginationDto) {
    return this.urlService.findAll(user.id, query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @AuthUser() user: IAuthUser) {
    return this.urlService.findOne(id, user.id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUrlDto: UpdateUrlDto,
    @AuthUser() user: IAuthUser,
  ) {
    return this.urlService.update(id, user.id, updateUrlDto.originalUrl);
  }

  @Delete(':id')
  async remove(@AuthUser() user: IAuthUser, @Param('id') id: string) {
    return this.urlService.delete(id, user.id);
  }
}
