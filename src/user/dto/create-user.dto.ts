import {
  IsEmail,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../enums/user-roles.enum';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'Jane Doe', minLength: 3, maxLength: 20 })
  @IsString()
  @MinLength(3, { message: 'Name must be at least 3 characters long' })
  @MaxLength(20, { message: 'Name must not exceed 20 characters' })
  name: string;

  @ApiProperty({ example: 'jane@example.com' })
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;

  @ApiProperty({ example: 'StrongPass123!', minLength: 6, maxLength: 50 })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(50, { message: 'Password must not exceed 50 characters' })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @IsEnum(UserRole, { message: 'Role must be either "user" or "admin"' })
  role: UserRole;
}
