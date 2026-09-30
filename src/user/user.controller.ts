import { Controller, Delete, Get, Body, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthUser } from '../auth/decorators/user.decorator';
import { IAuthUser } from '../auth/interfaces/auth.interface';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';

@Controller('api/users/me')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async getProfile(@AuthUser() user: IAuthUser) {
    return this.userService.findOne(user.id);
  }

  @Patch()
  async updateProfile(@AuthUser() user: IAuthUser, @Body() body: UpdateUserProfileDto) {
    return this.userService.updateProfile(user.id, body);
  }

  @Delete()
  async deleteProfile(@AuthUser() user: IAuthUser) {
    return this.userService.deleteProfile(user.id);
  }
}
