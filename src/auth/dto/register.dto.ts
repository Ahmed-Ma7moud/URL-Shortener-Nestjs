import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
export class RegisterDto {
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(20, { message: 'Name must not exceed 20 characters' })
  name: string;

  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  password: string;
}