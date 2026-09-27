import { IsNotEmpty, IsString, MinLength, MaxLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @MaxLength(50, { message: 'New password must not exceed 50 characters' })
  newPassword: string;
}
