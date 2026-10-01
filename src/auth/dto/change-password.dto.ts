import { IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123!' })
  @IsString()
  oldPassword: string;

  @ApiProperty({ example: 'NewStrongPass123!', minLength: 6, maxLength: 50 })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @MaxLength(50, { message: 'New password must be at most 50 characters long' })
  newPassword: string;
}
