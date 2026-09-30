import {
  Injectable,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UrlEntity } from './entities/url.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginationDto } from '../common/dto/pagination.dto';
import * as pagination from '../common/utils/pagination.util';
import { PaginationMetadata } from '../common/interface/common.interface';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(UrlEntity) private urlRepo: Repository<UrlEntity>,
    private readonly configService: ConfigService,
  ) {}

  generateUrlCode(length: number): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }

  async create(
    originalUrl: string,
    userId: string,
    maxRetries: number = 5,
  ): Promise<{ message: string; url: string }> {
    const domain = this.configService.getOrThrow<string>('DOMAIN');
    if (maxRetries <= 0) {
      throw new Error(
        'Failed to generate a unique short code after multiple attempts',
      );
    }

    const shortCode = this.generateUrlCode(6);

    try {
      const urlEntity = this.urlRepo.create({
        originalUrl,
        shortCode,
        userId,
      });
      await this.urlRepo.save(urlEntity);

      return {
        message: 'URL shortened successfully',
        url: `${domain}/${shortCode}`,
      };
    } catch (error: any) {
      if (error.code === '23505') {
        console.warn(`Short code collision detected: ${shortCode}`);
        return this.create(originalUrl, userId, maxRetries - 1);
      }
      throw new InternalServerErrorException('Failed to shorten URL');
    }
  }

  async redirect(shortCode: string): Promise<{ originalUrl: string }> {
    const urlEntity = await this.urlRepo.findOne({ where: { shortCode } });
    if (!urlEntity) {
      throw new BadRequestException('Invalid URL');
    }
    return { originalUrl: urlEntity.originalUrl };
  }

  async findAll(
    userId: string,
    query: PaginationDto,
  ): Promise<{ data: UrlEntity[]; metadata: PaginationMetadata }> {
    const { page, limit, skip } = pagination.parsePage(query);

    const [urls, total] = await this.urlRepo.findAndCount({
      where: { userId },
      skip,
      take: limit,
    });

    return {
      data: urls,
      metadata: pagination.buildPagination(page, limit, total),
    };
  }

  async findOne(
    urlId: string,
    userId: string,
  ): Promise<{ data: UrlEntity | null }> {
    const url = await this.urlRepo.findOne({ where: { id: urlId, userId } });
    if (!url) {
      throw new BadRequestException('URL not found');
    }
    return { data: url };
  }

  async update(
    urlId: string,
    userId: string,
    originalUrl: string,
  ): Promise<{ data: UrlEntity }> {
    const { data: url } = await this.findOne(urlId, userId);
    if (!url) {
      throw new BadRequestException('URL not found');
    }
    url.originalUrl = originalUrl;
    await this.urlRepo.save(url);
    return { data: url };
  }

  async delete(
    urlId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const urlEntity = await this.urlRepo.findOne({
      where: { id: urlId, userId },
    });

    if (!urlEntity) {
      throw new NotFoundException('URL not found');
    }

    await this.urlRepo.remove(urlEntity);
    return { message: 'URL deleted successfully' };
  }
}
