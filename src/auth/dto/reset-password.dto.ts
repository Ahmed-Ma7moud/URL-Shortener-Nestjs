import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'reset-token-from-verify-otp' })
  @IsNotEmpty()
  @IsString()
  token: string;

  @ApiProperty({ example: 'NewStrongPass123!', minLength: 6, maxLength: 50 })
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @MaxLength(50, { message: 'New password must not exceed 50 characters' })
  newPassword: string;
}
