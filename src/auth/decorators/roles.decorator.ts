import { SetMetadata } from '@nestjs/common';
export const USER_ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(USER_ROLES_KEY, roles);
