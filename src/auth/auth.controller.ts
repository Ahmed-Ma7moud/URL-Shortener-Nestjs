import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from './decorators/public.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { LoginDto } from './dto/login.dto';
import { IAuthUser } from './interfaces/auth.interface';
import { AuthUser } from './decorators/user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { Throttle } from '@nestjs/throttler';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({
    short: { ttl: 15 * 60 * 1000, limit: 5 },
    medium: { ttl: 60 * 60 * 1000, limit: 10 },
  })
  @Public()
  async register(@Body() body: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(body);
  }

  @Post('verify-otp')
  @Public()
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const { email, otp } = verifyOtpDto;
    return this.authService.verifyRegisterOtp(email, otp);
  }

  @Post('login')
  @Public()
  @Throttle({
    short: { ttl: 15 * 60 * 1000, limit: 5 },
    medium: { ttl: 60 * 60 * 1000, limit: 15 },
  })
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const { email, password } = loginDto;
    return this.authService.login(email, password);
  }

  @Post('refresh-token')
  @Public()
  @Throttle({
    short: { ttl: 15 * 60 * 1000, limit: 2 },
    medium: { ttl: 60 * 60 * 1000, limit: 5 },
  })
  async refreshAccessToken(
    @Body() body: RefreshTokenDto,
  ): Promise<{ accessToken: string }> {
    return this.authService.refreshAccessToken(body.refreshToken);
  }

  @Post('forgot-password')
  @Public()
  @Throttle({
    short: { ttl: 10 * 60 * 1000, limit: 2 },
    medium: { ttl: 60 * 60 * 1000, limit: 5 },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgetPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    return this.authService.forgetPassword(email);
  }

  @Post('verify-reset-otp')
  @Public()
  async verifyResetOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; token: string }> {
    const { email, otp } = verifyOtpDto;
    return this.authService.verifyResetPasswordOtp(email, otp);
  }

  @Post('reset-password')
  @Public()
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;
    return this.authService.resetPassword(token, newPassword);
  }

  @Post('change-password')
  async changePassword(
    @AuthUser() user: IAuthUser,
    @Body() { oldPassword, newPassword }: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user, oldPassword, newPassword);
  }

  @Post('logout')
  async logout(
    @AuthUser() user: IAuthUser,
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ message: string }> {
    return this.authService.logout(user, refreshToken);
  }
}
