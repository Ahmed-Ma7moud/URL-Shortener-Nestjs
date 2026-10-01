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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('api/urls')
@ApiBearerAuth()
@ApiTags('urls')
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post()
  @Throttle({
    short: { ttl: 60 * 1000, limit: 4 },
    medium: { ttl: 60 * 60 * 1000, limit: 10 },
    long: { ttl: 24 * 60 * 60 * 1000, limit: 15 },
  })
  @ApiOperation({ summary: 'Create a shortened URL' })
  @ApiResponse({
    status: 201,
    description: 'Short URL created',
    schema: {
      example: {
        id: '9c5b7d5e-6c5f-4d3e-9f8d-123456789abc',
        originalUrl: 'https://www.example.com/articles/nestjs',
        shortCode: 'aB3xYz',
        shortUrl: 'http://localhost:3000/aB3xYz',
      },
    },
  })
  async create(
    @Body() createUrlDto: CreateUrlDto,
    @AuthUser() user: IAuthUser,
  ) {
    return this.urlService.create(createUrlDto.originalUrl, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List the authenticated user URLs' })
  @ApiResponse({
    status: 200,
    description: 'Paginated URL list',
    schema: {
      example: {
        data: [],
        meta: { page: 1, limit: 10, total: 0, totalPages: 0 },
      },
    },
  })
  async findAll(@AuthUser() user: IAuthUser, @Query() query: PaginationDto) {
    return this.urlService.findAll(user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one shortened URL' })
  @ApiResponse({
    status: 200,
    description: 'URL details',
    schema: {
      example: {
        id: '9c5b7d5e-6c5f-4d3e-9f8d-123456789abc',
        originalUrl: 'https://www.example.com/articles/nestjs',
        shortCode: 'aB3xYz',
      },
    },
  })
  async findOne(@Param('id') id: string, @AuthUser() user: IAuthUser) {
    return this.urlService.findOne(id, user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shortened URL' })
  @ApiResponse({
    status: 200,
    description: 'URL updated',
    schema: { example: { message: 'URL updated successfully' } },
  })
  async update(
    @Param('id') id: string,
    @Body() updateUrlDto: UpdateUrlDto,
    @AuthUser() user: IAuthUser,
  ) {
    return this.urlService.update(id, user.id, updateUrlDto.originalUrl);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a shortened URL' })
  @ApiResponse({
    status: 200,
    description: 'URL deleted',
    schema: { example: { message: 'URL deleted successfully' } },
  })
  async remove(@AuthUser() user: IAuthUser, @Param('id') id: string) {
    return this.urlService.delete(id, user.id);
  }
}
