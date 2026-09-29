import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from './entities/user.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { RedisService } from '../redis/redis.service';
import { IAuthUser } from '../auth/interfaces/auth.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    private readonly redisService: RedisService,
  ) {}

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

    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    Object.assign(user, body);
    await this.userRepo.save(user);

    const { password, ...userWithoutPassword } = user;
    return { data: userWithoutPassword };
  }

  async deleteProfile(authUser: IAuthUser): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: authUser.id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    await this.userRepo.remove(user);
    const remainingTtl = authUser.exp - Math.floor(Date.now() / 1000);
    await this.redisService.set(`deleted:${authUser.id}`, true, remainingTtl);
    return { message: 'User profile deleted successfully' };
  }
}
