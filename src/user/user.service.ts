import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { RedisService } from '../redis/redis.service';
import { CreateUserDto } from './dto/create-user.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import * as pagination from '../common/utils/pagination.util';
import { PaginationMetadata } from '../common/interface/common.interface';
import ms, { StringValue } from 'ms';
import { AuthService } from '../auth/auth.service';
import { ConfigService } from '@nestjs/config';
import { UserRole } from './enums/user-roles.enum';
import { JwtSignOptions } from '@nestjs/jwt';
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly redisService: RedisService,
    private readonly dataSource: DataSource,
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ data: Partial<UserEntity> }> {
    try {
      const user = this.userRepo.create(createUserDto);
      await this.userRepo.save(user);
      const { password, ...userWithoutPassword } = user;
      return { data: userWithoutPassword };
    } catch (error: any) {
      if (error.code === '23505') {
        throw new BadRequestException('Email already exists');
      }
      throw new BadRequestException('Failed to create user');
    }
  }

  async findAll(query: PaginationDto): Promise<{
    data: Partial<UserEntity>[];
    metadata: PaginationMetadata;
  }> {
    const { page, limit, skip } = pagination.parsePage(query);

    const [users, totalCount] = await this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.name', 'user.role'])
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    return {
      data: usersWithoutPasswords,
      metadata: pagination.buildPagination(page, limit, totalCount),
    };
  }

  async findOne(id: string): Promise<{ data: Partial<UserEntity> } | null> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const { password, ...userWithoutPassword } = user;
    return { data: userWithoutPassword };
  }

  async updateProfile(
    id: string,
    body: UpdateUserProfileDto,
  ): Promise<{ data: Partial<UserEntity> }> {
    if (Object.keys(body).length === 0) {
      throw new BadRequestException('No data provided for update');
    }

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    Object.assign(user, body);
    await this.userRepo.save(user);

    const { password, ...userWithoutPassword } = user;
    return { data: userWithoutPassword };
  }

  async deleteProfile(userId: string): Promise<{ message: string }> {
    await this.dataSource.transaction(async (manager) => {
      const user = await manager.findOne(UserEntity, {
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      user.email = `del-${Date.now()}-${user.email}`;

      await manager.save(UserEntity, user);
      await manager.softRemove(UserEntity, user);
      await this.authService.revokeAllRefreshTokens(userId);
    });

    const expiresInString =
      this.configService.getOrThrow<string>('JWT_ACCESS_EXPIRES_IN') || '1d';
    const remainingTtl = Math.ceil(ms(expiresInString as StringValue) / 1000);

    if (remainingTtl > 0) {
      await this.redisService.set(`deleted:${userId}`, true, remainingTtl);
    }

    return { message: 'User profile deleted successfully' };
  }

  async updateUserRole(
    id: string,
    role: UserRole,
  ): Promise<{ data: Partial<UserEntity> }> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if(user.role !== UserRole.USER) {
      throw new BadRequestException('You can not change this user role');
    }

    if (user.role === role) {
      throw new BadRequestException(
        'Role is already set to the provided value',
      );
    }

    user.role = role;
    await this.dataSource.transaction(async (manager) => {
      await manager.save(UserEntity, user);
      // revoking all refresh tokens
      await this.authService.revokeAllRefreshTokens(user.id);
    });

    const expiresIn = this.configService.getOrThrow<
      JwtSignOptions['expiresIn']
    >('JWT_ACCESS_EXPIRES_IN');
    const ttl =
      typeof expiresIn === 'number'
        ? expiresIn
        : Math.ceil(ms(expiresIn ?? '1d') / 1000);
    const currentTime = Math.floor(Date.now() / 1000); // in seconds

    await this.redisService.set(`blacklist:${user.id}`, currentTime, ttl);

    const { password, ...userWithoutPassword } = user;
    return { data: userWithoutPassword };
  }
}
