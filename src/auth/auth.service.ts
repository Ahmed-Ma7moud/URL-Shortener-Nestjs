import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { UserEntity } from '../user/entities/user.entity';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { UserRole } from '../user/enums/user-roles.enum';
import { RegisterDto } from './dto/register.dto';
import { RedisService } from '../redis/redis.service';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { IAuthUser, IJwtPayload } from './interfaces/auth.interface';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { v7 as uuidv7 } from 'uuid';
import { Cron, CronExpression } from '@nestjs/schedule';
import { promises } from 'dns';

@Injectable()
export class AuthService {
  private readonly REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepo: Repository<RefreshTokenEntity>,
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  async isEmailTaken(email: string): Promise<boolean> {
    const user = await this.userRepo.findOne({ where: { email } });
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

  async generateRefreshToken(user: UserEntity): Promise<string> {
    const refreshToken = this.generateRandomBytes(32);
    const hashedToken = this.createHash(refreshToken);
    const expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_TTL); // 7 days
    const refreshTokenEntity = this.refreshTokenRepo.create({
      userId: user.id,
      token: hashedToken,
      expiresAt,
    });
    await this.refreshTokenRepo.save(refreshTokenEntity);
    return refreshToken;
  }

  async revokeAllRefreshTokens(userId: string): Promise<{message: string}> {
    await this.refreshTokenRepo.delete({ userId });
    return { message: 'All refresh tokens revoked successfully' };
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
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
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
    const user = this.userRepo.create({
      email: data.email,
      password: data.password,
      name: data.name,
      role: UserRole.USER,
    });
    await this.userRepo.save(user);
    await this.redisService.del(`register:${email}`);
    const accessToken = await this.generateJwt(user);

    const refreshToken = await this.generateRefreshToken(user);
    return { message: 'Registration successful', accessToken, refreshToken };
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
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const accessToken = await this.generateJwt(user);
    const refreshToken = await this.generateRefreshToken(user);

    return { message: 'Login successful', accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string) {
    const hashToken = this.createHash(refreshToken);
    const storedToken = await this.refreshTokenRepo.findOne({
      where: { token: hashToken },
    });
    if (!storedToken) {
      throw new ForbiddenException("Refresh token doesn't exist");
    }

    if (storedToken.expiresAt && storedToken.expiresAt < new Date()) {
      await this.refreshTokenRepo.remove(storedToken);
      throw new ForbiddenException('Refresh token has expired');
    }

    const user = await this.userRepo.findOne({
      where: { id: storedToken.userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newAccessToken = await this.generateJwt(user);

    if (storedToken.expiresAt) {
      storedToken.expiresAt = new Date(Date.now() + this.REFRESH_TOKEN_TTL);
      await this.refreshTokenRepo.save(storedToken);
    }

    return { accessToken: newAccessToken };
  }

  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async removeExpiredRefreshTokens() {
    const now = new Date();
    await this.refreshTokenRepo.delete({
      expiresAt: LessThan(now),
    });
  }

  async forgetPassword(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { email } });
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
    const user = await this.userRepo.findOne({ where: { email } });
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
    const user = await this.userRepo.findOne({
      where: { id: data.userId },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepo.update({ id: user.id }, { password: hashedPassword });
    await this.redisService.del(`reset-password-token:${hashedToken}`);
    return { message: 'Password reset successfully' };
  }

  async changePassword(
    authUser: IAuthUser,
    oldPassword: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepo.findOne({ where: { id: authUser.id } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepo.save(user);

    await this.refreshTokenRepo.delete({ userId: user.id });
    const remainingTTL = authUser.exp - Math.floor(Date.now() / 1000);
    await this.redisService.set(`blacklist:${authUser.jti}`, true, remainingTTL);
    return { message: 'Password changed successfully' };
  }

  async logout(
    user: IAuthUser,
    refreshToken: string,
  ): Promise<{ message: string }> {
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    const hashedToken = this.createHash(refreshToken);
    const storedToken = await this.refreshTokenRepo.findOne({
      where: { token: hashedToken, userId: user.id },
    });
    if (!storedToken) {
      throw new ForbiddenException(
        "Refresh token doesn't exist or doesn't belong to the user",
      );
    }
    await this.refreshTokenRepo.remove(storedToken);
    const remainingTTL = user.exp - Math.floor(Date.now() / 1000);
    await this.redisService.set(`blacklist:${user.jti}`, true, remainingTTL);
    return { message: 'Logged out successfully' };
  }

  async logoutAll(user: IAuthUser): Promise<{ message: string }> {
    await this.refreshTokenRepo.delete({ userId: user.id });
    const remainingTTL = user.exp - Math.floor(Date.now() / 1000);
    await this.redisService.set(`blacklist:${user.jti}`, true, remainingTTL);
    return { message: 'Logged out from all devices successfully' };
  }
}
