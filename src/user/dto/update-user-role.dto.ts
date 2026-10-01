import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '../enums/user-roles.enum';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({ enum: UserRole, example: UserRole.USER })
  @IsEnum(UserRole, {
    message: `Role must be one of the following: ${Object.values(UserRole).join(', ')}`,
  })
  role: string;
}
