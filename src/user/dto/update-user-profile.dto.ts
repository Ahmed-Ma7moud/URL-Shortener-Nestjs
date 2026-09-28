import { IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class UpdateUserProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(20, { message: 'Name must not exceed 20 characters' })
  name?: string;
}
