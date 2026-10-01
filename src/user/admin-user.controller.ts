import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Query,
  Patch,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRole } from './enums/user-roles.enum';
import { AuthorizationGuard } from '../auth/guards/authorization.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('api/admin/users')
@UseGuards(AuthorizationGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@ApiTags('admin users')
export class AdminUserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a user as an administrator' })
  @ApiResponse({ status: 201, description: 'User created' })
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({
    status: 200,
    description: 'Paginated user list',
    schema: { example: { data: [], meta: { page: 1, limit: 10, total: 0 } } },
  })
  async findAll(@Query() query: PaginationDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiResponse({ status: 200, description: 'User details' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update a user role' })
  @ApiResponse({
    status: 200,
    description: 'Role updated',
    schema: { example: { message: 'User role updated successfully' } },
  })
  async updateUser(
    @Param('id') userId: string,
    @Body() body: UpdateUserRoleDto,
  ) {
    return this.userService.updateUserRole(userId, body.role as UserRole);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({
    status: 200,
    description: 'User deleted',
    schema: { example: { message: 'User deleted successfully' } },
  })
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    return this.userService.deleteProfile(id);
  }
}
