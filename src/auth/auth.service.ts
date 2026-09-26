import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { UserRole } from '../user/enums/user-roles.enum';
import { RegisterDto } from './dto/register.dto';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { IAuthUser, IJwtPayload } from './interfaces/auth.interface';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async isEmailTaken(email: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { email } });
    return !!user;
  }

  generateOtp(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  protected createHash(code: string) {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  generateRandomBytes(size: number = 32): string {
    return crypto.randomBytes(size).toString('hex');
  }

  async generateJwt(user: UserEntity): Promise<string> {
    const payload: Partial<IJwtPayload> = {
      sub: user.id,
      role: user.role,
      jti: uuidv7(),
    };
    const expiresIn = this.configService.get<JwtSignOptions['expiresIn']>(
      'JWT_ACCESS_EXPIRES_IN',
    );
    const token = await this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn,
    });
    return token;
  }

  async register(body: RegisterDto): Promise<{ message: string }> {
    const { email, password, name } = body;
    const isEmailTaken = await this.isEmailTaken(email);
    if (isEmailTaken) {
      throw new ConflictException('Email is already taken');
    }
    const otp = this.generateOtp();
    console.log(`Generated OTP for ${email}: ${otp}`); // Log the OTP for testing purposes
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedOtp = this.createHash(otp);
    await this.redisService.set(
      `register:${email}`,
      { email, password: hashedPassword, name, otp: hashedOtp, attempts: 0 },
      300,
    ); // 5 minutes
    /* you can send the OTP to the user's email here using a mail service */
    return {
      message: 'OTP sent to email. Please verify to complete registration.',
    };
  }

  async verifyRegisterOtp(
    email: string,
    otp: string,
  ): Promise<{ message: string; token: string }> {
    const data = await this.redisService.get(`register:${email}`);
    if (!data) {
      throw new NotFoundException('No registration data found or OTP expired');
    }
    if (data.attempts >= 3) {
      await this.redisService.del(`register:${email}`);
      throw new UnauthorizedException(
        'Maximum OTP verification attempts exceeded. Please register again.',
      );
    }
    if (data.otp !== this.createHash(otp)) {
      data.attempts += 1;
      const remainingTTL = await this.redisService.getRemainingTtl(
        `register:${email}`,
      );
      await this.redisService.set(`register:${email}`, data, remainingTTL);
      throw new UnauthorizedException('Invalid OTP. Please try again.');
    }
    const user = this.userRepository.create({
      email: data.email,
      password: data.password,
      name: data.name,
      role: UserRole.USER,
    });
    await this.userRepository.save(user);
    await this.redisService.del(`register:${email}`);
    const token = await this.generateJwt(user);
    return { message: 'Registration successful', token };
  }

  async canVerifyRegisterOtp(email: string): Promise<boolean> {
    const data = await this.redisService.get(`register:${email}`);
    if (!data) {
      return false;
    }
    return true;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ message: string; token: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const token = await this.generateJwt(user);
    return { message: 'Login successful', token };
  }

  async forgetPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new NotFoundException('Email not found');
    }
    const otp = this.generateOtp();
    console.log(`Generated OTP for password reset ${email}: ${otp}`); // Log the OTP for testing purposes
    const hashedOtp = this.createHash(otp);
    await this.redisService.set(
      `reset-password:${email}`,
      { email, otp: hashedOtp, attempts: 0 },
      300,
    ); // 5 minutes
    /* you can send the OTP to the user's email here using a mail service */
    return {
      message: 'OTP sent to email. Please verify to reset your password.',
    };
  }

  async verifyResetPasswordOtp(
    email: string,
    otp: string,
  ): Promise<{ message: string; token: string }> {
    const data = await this.redisService.get(`reset-password:${email}`);
    if (!data) {
      throw new NotFoundException(
        'No reset password data found or OTP expired',
      );
    }
    if (data.attempts >= 3) {
      await this.redisService.del(`reset-password:${email}`);
      throw new UnauthorizedException(
        'Maximum OTP verification attempts exceeded. Please request a new OTP.',
      );
    }
    if (data.otp !== this.createHash(otp)) {
      data.attempts += 1;
      const remainingTTL = await this.redisService.getRemainingTtl(
        `reset-password:${email}`,
      );
      await this.redisService.set(
        `reset-password:${email}`,
        data,
        remainingTTL,
      );
      throw new UnauthorizedException('Invalid OTP. Please try again.');
    }
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    await this.redisService.del(`reset-password:${email}`);
    const token = this.generateRandomBytes(32);
    const hashedToken = this.createHash(token);
    await this.redisService.set(
      `reset-password-token:${hashedToken}`,
      { userId: user.id },
      600,
    ); // 10 minutes
    return { message: 'OTP verified successfully', token };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const hashedToken = this.createHash(token);
    const data = await this.redisService.get(
      `reset-password-token:${hashedToken}`,
    );
    if (!data) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const user = await this.userRepository.findOne({
      where: { id: data.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(
      { id: user.id },
      { password: hashedPassword },
    );
    await this.redisService.del(`reset-password-token:${hashedToken}`);
    return { message: 'Password reset successfully' };
  }

  async logout(user: IAuthUser): Promise<{ message: string }> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const remainingTTL = user.exp - Math.floor(Date.now() / 1000);
    await this.redisService.set(`blacklist:${user.jti}`, true, remainingTTL);
    return { message: 'Logged out successfully' };
  }
}
