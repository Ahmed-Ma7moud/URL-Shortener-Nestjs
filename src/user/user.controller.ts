import { Controller, Delete, Get, Body, Patch } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthUser } from '../auth/decorators/user.decorator';
import { IAuthUser } from '../auth/interfaces/auth.interface';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('api/users/me')
@ApiBearerAuth()
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Current user profile',
    schema: {
      example: {
        id: '9c5b7d5e-6c5f-4d3e-9f8d-123456789abc',
        name: 'Ahmed Ali',
        email: 'ahmed@example.com',
        role: 'user',
      },
    },
  })
  async getProfile(@AuthUser() user: IAuthUser) {
    return this.userService.findOne(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update the current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile updated',
    schema: { example: { message: 'Profile updated successfully' } },
  })
  async updateProfile(
    @AuthUser() user: IAuthUser,
    @Body() body: UpdateUserProfileDto,
  ) {
    return this.userService.updateProfile(user.id, body);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete the current user profile' })
  @ApiResponse({
    status: 200,
    description: 'Profile deleted',
    schema: { example: { message: 'Profile deleted successfully' } },
  })
  async deleteProfile(@AuthUser() user: IAuthUser) {
    return this.userService.deleteProfile(user.id);
  }
}
