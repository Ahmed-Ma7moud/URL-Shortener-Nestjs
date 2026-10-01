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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@Controller('api/auth')
@ApiTags('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({
    short: { ttl: 15 * 60 * 1000, limit: 5 },
    medium: { ttl: 60 * 60 * 1000, limit: 10 },
  })
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'Registration OTP sent successfully',
    schema: { example: { message: 'OTP sent to your email' } },
  })
  async register(@Body() body: RegisterDto): Promise<{ message: string }> {
    return this.authService.register(body);
  }

  @Post('verify-otp')
  @Public()
  @ApiOperation({ summary: 'Verify registration OTP' })
  @ApiResponse({
    status: 201,
    description: 'Account verified and tokens issued',
    schema: {
      example: {
        message: 'Account verified successfully',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
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
  @ApiOperation({ summary: 'Log in and receive access tokens' })
  @ApiResponse({
    status: 201,
    description: 'Login successful',
    schema: {
      example: {
        message: 'Login successful',
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
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
  @ApiOperation({ summary: 'Refresh an access token' })
  @ApiResponse({
    status: 201,
    description: 'New access token issued',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
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
  @ApiOperation({ summary: 'Request a password reset OTP' })
  @ApiResponse({
    status: 201,
    description: 'Password reset OTP sent',
    schema: { example: { message: 'OTP sent to your email' } },
  })
  async forgotPassword(
    @Body() forgotPasswordDto: ForgetPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    return this.authService.forgetPassword(email);
  }

  @Post('verify-reset-otp')
  @Public()
  @ApiOperation({ summary: 'Verify password reset OTP' })
  @ApiResponse({
    status: 201,
    description: 'Password reset token issued',
    schema: {
      example: {
        message: 'OTP verified successfully',
        token: 'reset-token...',
      },
    },
  })
  async verifyResetOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; token: string }> {
    const { email, otp } = verifyOtpDto;
    return this.authService.verifyResetPasswordOtp(email, otp);
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Reset a password using a reset token' })
  @ApiResponse({
    status: 201,
    description: 'Password reset successfully',
    schema: { example: { message: 'Password reset successfully' } },
  })
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;
    return this.authService.resetPassword(token, newPassword);
  }

  @Post('change-password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change the authenticated user password' })
  @ApiResponse({
    status: 201,
    description: 'Password changed successfully',
    schema: { example: { message: 'Password changed successfully' } },
  })
  async changePassword(
    @AuthUser() user: IAuthUser,
    @Body() { oldPassword, newPassword }: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.changePassword(user, oldPassword, newPassword);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      required: ['refreshToken'],
      properties: {
        refreshToken: {
          type: 'string',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Log out and revoke a refresh token' })
  @ApiResponse({
    status: 201,
    description: 'Logout successful',
    schema: { example: { message: 'Logged out successfully' } },
  })
  async logout(
    @AuthUser() user: IAuthUser,
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ message: string }> {
    return this.authService.logout(user, refreshToken);
  }
}
