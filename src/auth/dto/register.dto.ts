import { IsString, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
export class RegisterDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  name: string;
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;
}