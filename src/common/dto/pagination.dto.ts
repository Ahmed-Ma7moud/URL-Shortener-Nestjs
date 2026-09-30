import { Type } from 'class-transformer';
import { Max, IsOptional, Min, IsInt } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Page number must be greater than or equal to 1' })
  @Max(Number.MAX_SAFE_INTEGER, { message: 'Page number is too large' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1, { message: 'Limit must be greater than or equal to 1' })
  @Max(100, { message: 'Limit must be less than or equal to 100' })
  limit?: number;
}
