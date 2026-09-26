import { Controller, Post, Get, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthUser } from '../auth/decorators/user.decorator';
import { IAuthUser } from '../auth/interfaces/auth.interface';

@Controller('api/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@AuthUser() user: IAuthUser) {
    return this.userService.findOne(user.id);
  }
}