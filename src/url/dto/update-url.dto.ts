import { IsUrl } from 'class-validator';

export class UpdateUrlDto {
  @IsUrl({}, { message: 'Invalid URL format' })
  originalUrl: string;
}
