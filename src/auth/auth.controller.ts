import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { Public } from './decorators/public.decorator';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { LoginDto } from './dto/login.dto';

@Controller('api/auth')
@Public()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body() body: RegisterDto,
  ): Promise<{ message: string }> {
    return this.authService.register(body);
  }

  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; token: string }> {
    const { email, otp } = verifyOtpDto;
    return this.authService.verifyRegisterOtp(email, otp);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ message: string; token: string }> {
    const { email, password } = loginDto;
    return this.authService.login(email, password);
  }

  @Post('forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgetPasswordDto,
  ): Promise<{ message: string }> {
    const { email } = forgotPasswordDto;
    return this.authService.forgetPassword(email);
  }

  @Post('verify-reset-otp')
  async verifyResetOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ): Promise<{ message: string; token: string }> {
    const { email, otp } = verifyOtpDto;
    return this.authService.verifyResetPasswordOtp(email, otp);
  }

  @Post('reset-password')
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, newPassword } = resetPasswordDto;
    return this.authService.resetPassword(token, newPassword);
  }
}
