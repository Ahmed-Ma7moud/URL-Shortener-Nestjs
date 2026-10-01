import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUrlDto {
  @ApiProperty({ example: 'https://www.example.com/updated-article' })
  @IsUrl({}, { message: 'Invalid URL format' })
  originalUrl: string;
}
