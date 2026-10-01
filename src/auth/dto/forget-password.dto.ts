import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ForgetPasswordDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  @Transform(({ value }) => value.trim().toLowerCase())
  email: string;
}
