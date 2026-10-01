import { IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUrlDto {
  @ApiProperty({ example: 'https://www.example.com/articles/nestjs' })
  @IsUrl({}, { message: 'Invalid URL format' })
  originalUrl: string;
}
